import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { AttendanceStatus } from "@/types";

// GET /api/attendance - List attendance records (Role-restricted)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    const where: any = {};

    // Strict RBAC: Employees can ONLY view their own attendance records
    if (!isPrivileged) {
      where.userId = session.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/attendance - Check-in or Check-out
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = "auto", notes, targetUserId } = body;

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";
    const effectiveUserId = isPrivileged && targetUserId ? targetUserId : session.id;

    // Normalize date to start of current day UTC
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Check if an attendance record already exists for today
    let record = await prisma.attendanceRecord.findUnique({
      where: {
        userId_date: {
          userId: effectiveUserId,
          date: startOfToday,
        },
      },
    });

    let resultRecord;
    let auditAction = "";

    if (!record) {
      // Perform Check-in
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isLate = hour > 9 || (hour === 9 && minute > 30);
      const status: AttendanceStatus = isLate ? "LATE" : "PRESENT";

      resultRecord = await prisma.attendanceRecord.create({
        data: {
          userId: effectiveUserId,
          date: startOfToday,
          checkIn: now,
          status,
          workingHours: 0,
          notes: notes || (isLate ? "Late arrival" : "Standard check-in"),
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      auditAction = "ATTENDANCE_CHECKIN";
    } else if (!record.checkOut || action === "checkout") {
      // Perform Check-out
      const checkInTime = record.checkIn ? new Date(record.checkIn).getTime() : now.getTime();
      const checkOutTime = now.getTime();
      const hoursDiff = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
      const roundedHours = Math.round(hoursDiff * 100) / 100;

      let newStatus = record.status;
      if (roundedHours < 4.5 && record.status !== "ABSENT") {
        newStatus = "HALF_DAY";
      }

      resultRecord = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkOut: now,
          workingHours: roundedHours,
          status: newStatus,
          notes: notes ? `${record.notes || ""}; ${notes}`.trim() : record.notes,
        },
      });

      auditAction = "ATTENDANCE_CHECKOUT";
    } else {
      return NextResponse.json(
        { error: "Attendance already completed for today", record },
        { status: 400 }
      );
    }

    await createAuditLog({
      actorId: session.id,
      action: auditAction,
      entity: "AttendanceRecord",
      entityId: resultRecord.id,
      details: {
        userId: effectiveUserId,
        status: resultRecord.status,
        checkIn: resultRecord.checkIn,
        checkOut: resultRecord.checkOut,
        workingHours: resultRecord.workingHours,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: auditAction === "ATTENDANCE_CHECKIN" ? "Checked in successfully" : "Checked out successfully",
      record: resultRecord,
    });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
