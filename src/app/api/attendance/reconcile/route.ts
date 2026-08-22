import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { calculateMonthlyAttendance } from "@/features/attendance/lopNormalizer";
import prisma from "@/lib/prisma";

// GET /api/attendance/reconcile?employeeId=EMP-001&month=MM&year=YYYY
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId") || searchParams.get("userId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";
    const targetIdentifier = employeeIdParam || session.id;

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetIdentifier },
          { profile: { employeeId: targetIdentifier } },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `Employee not found with identifier: ${targetIdentifier}` },
        { status: 404 }
      );
    }

    const isSelf = session.id === targetUser.id;
    if (!isPrivileged && !isSelf) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own attendance reconciliation" },
        { status: 403 }
      );
    }

    const reconciliation = await calculateMonthlyAttendance(
      targetUser.id,
      monthParam || undefined,
      yearParam || undefined
    );

    return NextResponse.json({
      employeeId: targetUser.profile?.employeeId || targetUser.id,
      userId: targetUser.id,
      employeeName: targetUser.profile
        ? `${targetUser.profile.firstName} ${targetUser.profile.lastName}`
        : targetUser.email,
      department: targetUser.profile?.department || "General",
      month: monthParam ? parseInt(monthParam, 10) : new Date().getUTCMonth() + 1,
      year: yearParam ? parseInt(yearParam, 10) : new Date().getUTCFullYear(),
      ...reconciliation,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/reconcile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate attendance reconciliation" },
      { status: 500 }
    );
  }
}
