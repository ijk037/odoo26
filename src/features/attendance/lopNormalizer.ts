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

// ponytail: stdlib ISO slice replaces custom padding logic
export const formatDateToUTCString = (date: Date): string =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);

// ponytail: native ISO UTC parser replaces manual string split & int parsing
export const parseDateStringToUTCDate = (dateStr: string): Date =>
  new Date(`${dateStr.trim().slice(0, 10)}T00:00:00.000Z`);

/**
 * calculateMonthlyAttendance(employeeId, month, year)
 * Reconciles monthly logs to determine present days, approved leaves, and unauthorized LOP absences.
 */
export async function calculateMonthlyAttendance(
  employeeId: string,
  month?: number | string,
  year?: number | string
): Promise<MonthlyAttendanceReconciliation> {
  if (!employeeId) throw new Error("employeeId is required");

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: employeeId }, { profile: { employeeId } }],
    },
    include: { profile: true },
  });

  if (!user) throw new Error(`Employee not found: ${employeeId}`);

  const now = new Date();
  const parsedYear = Number(year) || now.getUTCFullYear();
  const parsedMonth = Math.min(Math.max(Number(month) || now.getUTCMonth() + 1, 1), 12);

  const totalDays = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
  const startOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, totalDays, 23, 59, 59, 999));

  const [attendanceRecords, approvedLeaves] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } },
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

  const attendanceMap = new Map(
    attendanceRecords.map((r) => [formatDateToUTCString(new Date(r.date)), r])
  );

  let presentDays = 0;
  let approvedLeaveDays = 0;
  let unauthorizedAbsenceDays = 0;
  const flaggedDates: ReconcileFlaggedDate[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const calendarDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, day, 0, 0, 0, 0));
    const dateKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendanceMap.get(dateKey);

    const isCoveredByLeave = approvedLeaves.some(
      (l) => calendarDate >= new Date(l.startDate) && calendarDate <= new Date(l.endDate)
    );

    const hasCheckIn = Boolean(
      record &&
        (record.checkIn !== null ||
          ["PRESENT", "LATE", "HALF_DAY"].includes(record.status))
    );

    if (hasCheckIn) {
      presentDays++;
    } else if (isCoveredByLeave) {
      approvedLeaveDays++;
    } else if (
      record?.status === "ON_LEAVE" ||
      record?.notes?.includes("EXCUSED") ||
      record?.notes?.includes("[RESOLVED]")
    ) {
      approvedLeaveDays++;
      flaggedDates.push({
        date: dateKey,
        reason: record?.notes || "Excused absence resolved by HR",
        status: "RESOLVED",
      });
    } else if (record?.notes?.includes("CONFIRMED_LOP")) {
      unauthorizedAbsenceDays++;
      flaggedDates.push({
        date: dateKey,
        reason: record?.notes || "Confirmed Loss-of-Pay (LOP) by HR",
        status: "RESOLVED",
      });
    } else {
      unauthorizedAbsenceDays++;
      flaggedDates.push({
        date: dateKey,
        reason: record?.notes
          ? `UNAUTHORIZED_ABSENCE: ${record.notes}`
          : "UNAUTHORIZED_ABSENCE: No check-in log and no approved leave record found",
        status: "FLAGGED",
      });
    }
  }

  return {
    totalDays,
    presentDays,
    approvedLeaveDays,
    unauthorizedAbsenceDays,
    payableDays: presentDays + approvedLeaveDays,
    flaggedDates,
  };
}

/**
 * resolveReconciliationDates
 * Updates flagged absence dates to excused or confirmed LOP and creates audit logs.
 */
export async function resolveReconciliationDates({
  employeeId,
  date,
  dates,
  resolution,
  reason,
  actorId,
}: ResolveDateParams) {
  if (!employeeId) throw new Error("employeeId is required");
  const targetDates = Array.isArray(dates) && dates.length > 0 ? dates : date ? [date] : [];
  if (targetDates.length === 0) throw new Error("At least one date is required");

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: employeeId }, { profile: { employeeId } }] },
    include: { profile: true },
  });

  if (!user) throw new Error(`Employee not found: ${employeeId}`);

  const isExcused = ["EXCUSED", "RESOLVED", "APPROVED", "EXCUSE"].includes(
    resolution?.toUpperCase() || ""
  );

  const updatedRecords = await Promise.all(
    targetDates.map(async (dateStr) => {
      const utcDate = parseDateStringToUTCDate(dateStr);
      const status = isExcused ? "ON_LEAVE" : "ABSENT";
      const notePrefix = isExcused ? "[RESOLVED: EXCUSED]" : "[RESOLVED: CONFIRMED_LOP]";
      const finalReason = reason ? `${notePrefix} ${reason.trim()}` : `${notePrefix} Processed by HR`;

      const record = await prisma.attendanceRecord.upsert({
        where: { userId_date: { userId: user.id, date: utcDate } },
        update: { status, notes: finalReason },
        create: {
          userId: user.id,
          date: utcDate,
          status,
          notes: finalReason,
          workingHours: 0,
        },
      });

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

      return record;
    })
  );

  return {
    success: true,
    count: updatedRecords.length,
    resolvedDates: targetDates,
    resolution: isExcused ? "EXCUSED" : "CONFIRMED_LOP",
    records: updatedRecords,
  };
}

const lopNormalizer = {
  calculateMonthlyAttendance,
  resolveReconciliationDates,
};

export default lopNormalizer;
