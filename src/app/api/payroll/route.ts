import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { calculateSalary } from "@/features/payroll/salaryCalculator";
import { calculateMonthlyAttendance } from "@/features/attendance/lopNormalizer";
import { PayrollLedgerRecord, PayrollRecordStatus } from "@/types";

// In-memory status registry keyed by `${userId}_${year}_${month}` to supplement AuditLog
const statusStore = new Map<string, { status: PayrollRecordStatus; updatedAt: string }>();

// Helper to build storage key
function getStatusKey(userId: string, year: number, month: number): string {
  return `${userId}_${year}_${month}`;
}

// GET /api/payroll?month=MM&year=YYYY&userId=...&employeeId=...
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const targetUserId = searchParams.get("userId");
    const targetEmpId = searchParams.get("employeeId");

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getUTCMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getUTCFullYear();

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // Where query for users
    const whereUser: any = {
      status: "ACTIVE",
    };

    // Non-privileged users can ONLY see their own payroll
    if (!isPrivileged) {
      whereUser.id = session.id;
    } else if (targetUserId) {
      whereUser.id = targetUserId;
    } else if (targetEmpId) {
      whereUser.profile = { employeeId: targetEmpId };
    }

    // Fetch users with profiles & salary structures
    const users = await prisma.user.findMany({
      where: whereUser,
      include: {
        profile: true,
        salaryStructure: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Also look up recent payroll status audit logs for this period to populate statuses if empty
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ["PAYROLL_STATUS_UPDATE", "PAYROLL_BULK_RUN", "PAYROLL_DISBURSEMENT"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Populate status store from audit logs if needed
    for (const log of auditLogs) {
      try {
        if (log.details) {
          const parsed = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
          if (parsed.userId && parsed.month && parsed.year && parsed.status) {
            const key = getStatusKey(parsed.userId, parsed.year, parsed.month);
            if (!statusStore.has(key)) {
              statusStore.set(key, {
                status: parsed.status,
                updatedAt: log.createdAt.toISOString(),
              });
            }
          }
        }
      } catch {
        // Ignore unparseable logs
      }
    }

    // Process each user into a PayrollLedgerRecord
    const records: PayrollLedgerRecord[] = [];

    for (const u of users) {
      const profile = u.profile;
      const salaryStruct = u.salaryStructure;

      // Base Gross Calculation: Base pay + allowances (or fallback base)
      const basePay = salaryStruct?.baseSalary ?? 6500;
      const allowances = salaryStruct?.allowances ?? 0;
      const grossSalary = basePay + allowances;
      const currency = salaryStruct?.currency || "USD";

      // Calculate attendance & Loss of Pay for this specific period
      let lopDays = 0;
      let payableDays = 30;
      let totalDays = 30;

      try {
        const attendanceRecon = await calculateMonthlyAttendance(u.id, month, year);
        lopDays = attendanceRecon.unauthorizedAbsenceDays || 0;
        payableDays = attendanceRecon.payableDays;
        totalDays = attendanceRecon.totalDays;
      } catch (attErr) {
        console.warn(`Attendance reconcile skipped for user ${u.id}:`, attErr);
      }

      // Compute itemized salary breakdown using Deductions Engine
      const breakdown = calculateSalary({ grossSalary, lopDays });

      // Determine current status
      const statusKey = getStatusKey(u.id, year, month);
      const stored = statusStore.get(statusKey);
      const currentStatus: PayrollRecordStatus = stored?.status || "Draft";

      const empId = profile?.employeeId || `EMP-${u.id.slice(0, 4).toUpperCase()}`;
      const fullName = profile ? `${profile.firstName} ${profile.lastName}` : u.email.split("@")[0];

      records.push({
        id: salaryStruct?.id || u.id,
        userId: u.id,
        employeeId: empId,
        name: fullName,
        email: u.email,
        department: profile?.department || "General",
        designation: profile?.designation || "Team Member",
        avatarUrl: profile?.avatarUrl,
        grossSalary,
        lopDays,
        payableDays,
        totalDays,
        currency,
        breakdown,
        status: currentStatus,
        paymentMethod: salaryStruct?.paymentMethod || "BANK_TRANSFER",
        bankName: salaryStruct?.bankName,
        accountNumber: salaryStruct?.accountNumber,
        month,
        year,
        updatedAt: stored?.updatedAt || u.updatedAt.toISOString(),
      });
    }

    // Compute Summary Stats
    const totalGross = records.reduce((acc, r) => acc + r.grossSalary, 0);
    const totalNet = records.reduce((acc, r) => acc + r.breakdown.netPay, 0);
    const totalDeductions = records.reduce((acc, r) => acc + r.breakdown.totalDeductions, 0);
    const totalLopDays = records.reduce((acc, r) => acc + r.lopDays, 0);
    const draftCount = records.filter((r) => r.status === "Draft").length;
    const approvedCount = records.filter((r) => r.status === "Approved").length;
    const paidCount = records.filter((r) => r.status === "Paid").length;

    return NextResponse.json({
      records,
      month,
      year,
      summary: {
        totalEmployees: records.length,
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalLopDays,
        draftCount,
        approvedCount,
        paidCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/payroll error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load payroll ledger" },
      { status: 500 }
    );
  }
}

// POST /api/payroll - Update individual or bulk status transitions
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json(
        { error: "Forbidden: Admin or HR privileges required to manage payroll" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      bulk = false,
      userId,
      userIds,
      status: targetStatus,
      action = "TRANSITION_NEXT",
      month: reqMonth,
      year: reqYear,
      notes,
    } = body;

    const now = new Date();
    const month = reqMonth || now.getUTCMonth() + 1;
    const year = reqYear || now.getUTCFullYear();
    const timestamp = new Date().toISOString();

    const updatedUserIds: string[] = [];

    if (bulk) {
      // Bulk update handling
      // If userIds provided, use them; otherwise fetch all active users
      let targetList: string[] = [];
      if (Array.isArray(userIds) && userIds.length > 0) {
        targetList = userIds;
      } else {
        const allUsers = await prisma.user.findMany({
          where: { status: "ACTIVE" },
          select: { id: true },
        });
        targetList = allUsers.map((u) => u.id);
      }

      // Check current overall state if action is TRANSITION_NEXT
      let nextStatus: PayrollRecordStatus = targetStatus || "Approved";
      if (!targetStatus && action === "TRANSITION_NEXT") {
        // Count how many are in Draft vs Approved
        let hasDraft = false;
        for (const uid of targetList) {
          const st = statusStore.get(getStatusKey(uid, year, month))?.status || "Draft";
          if (st === "Draft") {
            hasDraft = true;
            break;
          }
        }
        nextStatus = hasDraft ? "Approved" : "Paid";
      }

      for (const uid of targetList) {
        const key = getStatusKey(uid, year, month);
        const current = statusStore.get(key)?.status || "Draft";

        let finalStatus = nextStatus;
        if (action === "TRANSITION_NEXT") {
          if (current === "Draft") finalStatus = "Approved";
          else if (current === "Approved") finalStatus = "Paid";
          else finalStatus = "Paid";
        }

        statusStore.set(key, {
          status: finalStatus,
          updatedAt: timestamp,
        });
        updatedUserIds.push(uid);
      }

      // Record Audit Log for Bulk Run
      await createAuditLog({
        actorId: session.id,
        action: "PAYROLL_BULK_RUN",
        entity: "PayrollLedger",
        entityId: `BULK-${year}-${month}`,
        details: {
          action,
          targetStatus: nextStatus,
          month,
          year,
          count: updatedUserIds.length,
          userIds: updatedUserIds,
          notes: notes || `Bulk payroll run transitioned to ${nextStatus}`,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      return NextResponse.json({
        success: true,
        message: `Successfully transitioned ${updatedUserIds.length} payroll records to ${nextStatus}`,
        updatedCount: updatedUserIds.length,
        status: nextStatus,
      });
    } else {
      // Single record update
      if (!userId) {
        return NextResponse.json({ error: "userId is required for individual status update" }, { status: 400 });
      }

      const key = getStatusKey(userId, year, month);
      const current = statusStore.get(key)?.status || "Draft";

      let nextStatus: PayrollRecordStatus = targetStatus;
      if (!nextStatus) {
        if (current === "Draft") nextStatus = "Approved";
        else if (current === "Approved") nextStatus = "Paid";
        else nextStatus = "Draft";
      }

      statusStore.set(key, {
        status: nextStatus,
        updatedAt: timestamp,
      });

      // Record Audit Log for Individual Update
      await createAuditLog({
        actorId: session.id,
        action: "PAYROLL_STATUS_UPDATE",
        entity: "PayrollLedger",
        entityId: `${userId}-${year}-${month}`,
        details: {
          userId,
          previousStatus: current,
          status: nextStatus,
          month,
          year,
          notes: notes || `Individual payroll status changed from ${current} to ${nextStatus}`,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      return NextResponse.json({
        success: true,
        message: `Payroll status updated to ${nextStatus}`,
        userId,
        status: nextStatus,
      });
    }
  } catch (error: any) {
    console.error("POST /api/payroll error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update payroll status" },
      { status: 500 }
    );
  }
}
