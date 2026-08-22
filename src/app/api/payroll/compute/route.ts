import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { calculateDynamicPayroll, numberToWords } from "@/lib/payroll/calculator";

// GET /api/payroll/compute - Compute dynamic itemized paystub(s)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7); // e.g. "2026-08"

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // Non-privileged users can only calculate and view their own paystub
    const effectiveUserId = !isPrivileged ? session.id : targetUserId || undefined;

    const where: any = {};
    if (effectiveUserId) {
      where.id = effectiveUserId;
    }

    // Determine start and end of the requested month
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const startDate = new Date(Date.UTC(year, monthIndex, 1));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

    // Calculate total standard working days in this month (Monday-Friday)
    let totalWorkingDays = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        totalWorkingDays++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        salaryStructure: true,
        attendanceRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        leaveRequests: {
          where: {
            status: "APPROVED",
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            ],
          },
        },
      },
    });

    const paystubs = users.map((u) => {
      const salary = u.salaryStructure || {
        baseSalary: 5000,
        allowances: 500,
        deductions: 400,
        currency: "USD",
        paymentMethod: "BANK_TRANSFER",
        bankName: "Corporate Bank",
        accountNumber: "**** **** 0000",
      };

      const records = u.attendanceRecords || [];
      const presentDays = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const halfDays = records.filter((r) => r.status === "HALF_DAY").length;
      const lateDays = records.filter((r) => r.status === "LATE").length;

      // Count approved unpaid leaves
      const unpaidLeaves = u.leaveRequests.filter((l) => l.leaveType === "UNPAID");
      const unpaidLeaveDays = unpaidLeaves.reduce((acc, l) => acc + l.daysCount, 0);

      // Paid leaves
      const paidLeaves = u.leaveRequests.filter((l) => l.leaveType !== "UNPAID");
      const paidLeaveDays = paidLeaves.reduce((acc, l) => acc + l.daysCount, 0);

      const paystub = calculateDynamicPayroll(
        {
          baseSalary: salary.baseSalary,
          allowances: salary.allowances,
          deductions: salary.deductions,
          totalWorkingDays: totalWorkingDays || 22,
          presentDays: presentDays > 0 ? presentDays : totalWorkingDays,
          paidLeaveDays,
          unpaidLeaveDays,
          halfDays,
          lateDays,
        },
        salary.currency
      );

      const paystubRef = `PAY-${year}${String(monthIndex + 1).padStart(2, "0")}-${u.profile?.employeeId || u.id.slice(-4)}`;

      return {
        referenceNumber: paystubRef,
        month,
        period: `${new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        user: {
          id: u.id,
          email: u.email,
          role: u.role,
          profile: u.profile,
          bankDetails: {
            method: salary.paymentMethod,
            bankName: salary.bankName,
            accountNumber: salary.accountNumber,
          },
        },
        ...paystub,
        netPayableInWords: numberToWords(paystub.netPayable),
      };
    });

    return NextResponse.json({
      paystubs: effectiveUserId ? paystubs[0] : paystubs,
    });
  } catch (error) {
    console.error("GET /api/payroll/compute error:", error);
    return NextResponse.json({ error: "Failed to compute payroll" }, { status: 500 });
  }
}
