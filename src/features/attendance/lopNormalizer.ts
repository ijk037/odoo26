import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export type FlaggedDateStatus = "FLAGGED" | "RESOLVED";

export interface ReconcileFlaggedDate {
  date: string;
  reason: string;
  status: FlaggedDateStatus;
}

export interface MonthlyAttendanceReconciliation {
  totalDays: number;
  presentDays: number;
  approvedLeaveDays: number;
  unauthorizedAbsenceDays: number;
  payableDays: number;
  flaggedDates: ReconcileFlaggedDate[];
}

export interface ResolveDateParams {
  employeeId: string;
  date?: string;
  dates?: string[];
  resolution: "EXCUSED" | "CONFIRMED_LOP" | "RESOLVED" | "LOP" | string;
  reason?: string;
  actorId?: string | null;
}

/**
 * Format a Date object to YYYY-MM-DD UTC string
 */
export function formatDateToUTCString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse date string YYYY-MM-DD into UTC midnight Date object
 */
export function parseDateStringToUTCDate(dateStr: string): Date {
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  const fallback = new Date(dateStr);
  return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate(), 0, 0, 0, 0));
}

/**
 * calculateMonthlyAttendance(employeeId, month, year)
 * 
 * Computes monthly attendance reconciliation and Loss-of-Pay (LOP) analysis
 * without mutating database structures or breaking existing routes.
 * 
 * @param employeeId - User id (cuid) or Profile employeeId (e.g. "EMP-001")
 * @param month - Month 1-12 (or string "01"-"12" / "1"-"12")
 * @param year - Target year (e.g. 2026)
 */
export async function calculateMonthlyAttendance(
  employeeId: string,
  month?: number | string,
  year?: number | string
): Promise<MonthlyAttendanceReconciliation> {
  if (!employeeId) {
    throw new Error("employeeId is required");
  }

  // 1. Resolve target employee / user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: employeeId },
        { profile: { employeeId: employeeId } },
      ],
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  // 2. Resolve Year and Month (1-based: 1 = Jan, 12 = Dec)
  const now = new Date();
  let parsedYear = year ? (typeof year === "string" ? parseInt(year, 10) : year) : now.getUTCFullYear();
  let parsedMonth = month ? (typeof month === "string" ? parseInt(month, 10) : month) : now.getUTCMonth() + 1;

  if (isNaN(parsedYear) || parsedYear < 1970 || parsedYear > 2100) {
    parsedYear = now.getUTCFullYear();
  }
  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    parsedMonth = now.getUTCMonth() + 1;
  }

  // 3. Compute calendar boundary for target month
  const totalDays = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
  const startOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, totalDays, 23, 59, 59, 999));

  // 4. Fetch daily attendance records and approved leaves for target month
  const [attendanceRecords, approvedLeaves] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
    }),
  ]);

  // Index attendance records by UTC date string YYYY-MM-DD
  const attendanceMap = new Map<string, typeof attendanceRecords[0]>();
  for (const record of attendanceRecords) {
    const key = formatDateToUTCString(new Date(record.date));
    attendanceMap.set(key, record);
  }

  // Helper to check if a specific day is within an approved leave request
  const getApprovedLeave = (targetDate: Date) => {
    return approvedLeaves.find((leave) => {
      const leaveStart = new Date(
        Date.UTC(
          leave.startDate.getUTCFullYear(),
          leave.startDate.getUTCMonth(),
          leave.startDate.getUTCDate(),
          0, 0, 0, 0
        )
      );
      const leaveEnd = new Date(
        Date.UTC(
          leave.endDate.getUTCFullYear(),
          leave.endDate.getUTCMonth(),
          leave.endDate.getUTCDate(),
          23, 59, 59, 999
        )
      );
      return targetDate >= leaveStart && targetDate <= leaveEnd;
    });
  };

  let presentDays = 0;
  let approvedLeaveDays = 0;
  let unauthorizedAbsenceDays = 0;
  const flaggedDates: ReconcileFlaggedDate[] = [];

  // 5. Scan all calendar days in target month
  for (let day = 1; day <= totalDays; day++) {
    const calendarDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, day, 0, 0, 0, 0));
    const dateKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendanceMap.get(dateKey);
    const approvedLeave = getApprovedLeave(calendarDate);

    // Case A: Checked in / marked present
    const hasCheckIn = Boolean(
      record &&
      (record.checkIn !== null ||
        record.status === "PRESENT" ||
        record.status === "LATE" ||
        record.status === "HALF_DAY")
    );

    if (hasCheckIn) {
      presentDays++;
      continue;
    }

    // Case B: Covered by an approved leave request
    if (approvedLeave) {
      approvedLeaveDays++;
      continue;
    }

    // Case C: Checked if previously marked as excused/resolved by HR in attendance notes
    const isExcusedResolution = Boolean(
      record &&
      (record.status === "ON_LEAVE" ||
        (record.notes &&
          (record.notes.includes("[RESOLVED: EXCUSED]") ||
            record.notes.includes("EXCUSED") ||
            record.notes.includes("[RESOLVED]"))))
    );

    if (isExcusedResolution) {
      approvedLeaveDays++;
      flaggedDates.push({
        date: dateKey,
        reason: record?.notes || "Excused absence resolved by HR",
        status: "RESOLVED",
      });
      continue;
    }

    // Case D: Checked if explicitly confirmed as LOP by HR
    const isConfirmedLOP = Boolean(
      record &&
      record.notes &&
      (record.notes.includes("[RESOLVED: CONFIRMED_LOP]") ||
        record.notes.includes("CONFIRMED_LOP"))
    );

    if (isConfirmedLOP) {
      unauthorizedAbsenceDays++;
      flaggedDates.push({
        date: dateKey,
        reason: record?.notes || "Confirmed Loss-of-Pay (LOP) by HR",
        status: "RESOLVED",
      });
      continue;
    }

    // Case E: Unauthorized Absence (NO check-in and NO approved leave record)
    unauthorizedAbsenceDays++;
    const absenceReason = record?.notes
      ? `UNAUTHORIZED_ABSENCE: ${record.notes}`
      : "UNAUTHORIZED_ABSENCE: No check-in log and no approved leave record found";

    flaggedDates.push({
      date: dateKey,
      reason: absenceReason,
      status: "FLAGGED",
    });
  }

  // 6. Compute payable days
  const payableDays = presentDays + approvedLeaveDays;

  return {
    totalDays,
    presentDays,
    approvedLeaveDays,
    unauthorizedAbsenceDays,
    payableDays,
    flaggedDates,
  };
}

/**
 * resolveReconciliationDates
 * 
 * Allows HR to mark flagged dates as resolved/excused or confirmed LOP
 * without altering database schema definitions.
 */
export async function resolveReconciliationDates({
  employeeId,
  date,
  dates,
  resolution,
  reason,
  actorId,
}: ResolveDateParams) {
  if (!employeeId) {
    throw new Error("employeeId is required");
  }

  const targetDates: string[] = [];
  if (Array.isArray(dates) && dates.length > 0) {
    targetDates.push(...dates);
  } else if (date) {
    targetDates.push(date);
  }

  if (targetDates.length === 0) {
    throw new Error("At least one date is required for reconciliation resolution");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: employeeId },
        { profile: { employeeId: employeeId } },
      ],
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  const normalizedResolution = resolution?.toUpperCase() || "RESOLVED";
  const isExcused =
    normalizedResolution === "EXCUSED" ||
    normalizedResolution === "RESOLVED" ||
    normalizedResolution === "APPROVED" ||
    normalizedResolution === "EXCUSE";

  const updatedRecords = [];

  for (const dateStr of targetDates) {
    const utcDate = parseDateStringToUTCDate(dateStr);
    const status = isExcused ? "ON_LEAVE" : "ABSENT";
    const notePrefix = isExcused ? "[RESOLVED: EXCUSED]" : "[RESOLVED: CONFIRMED_LOP]";
    const finalReason = reason ? `${notePrefix} ${reason.trim()}` : `${notePrefix} Processed by HR`;

    const record = await prisma.attendanceRecord.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: utcDate,
        },
      },
      update: {
        status,
        notes: finalReason,
      },
      create: {
        userId: user.id,
        date: utcDate,
        status,
        notes: finalReason,
        workingHours: 0,
      },
    });

    updatedRecords.push(record);

    await createAuditLog({
      actorId: actorId || null,
      action: "ATTENDANCE_RECONCILE_RESOLVE",
      entity: "AttendanceRecord",
      entityId: record.id,
      details: {
        employeeId: user.profile?.employeeId || user.id,
        date: dateStr,
        resolution: isExcused ? "EXCUSED" : "CONFIRMED_LOP",
        reason: reason || "Processed by HR reconciliation engine",
      },
    });
  }

  return {
    success: true,
    count: updatedRecords.length,
    resolvedDates: targetDates,
    resolution: isExcused ? "EXCUSED" : "CONFIRMED_LOP",
    records: updatedRecords,
  };
}

export default {
  calculateMonthlyAttendance,
  resolveReconciliationDates,
};
