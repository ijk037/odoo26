import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import {
  validateGeofence,
  validateIpAddress,
  evaluateShiftCheckIn,
  evaluateShiftCheckOut,
  SHIFTS,
} from "@/lib/attendance/shifts";

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
    const department = searchParams.get("department");

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

    if (department && isPrivileged) {
      where.user = {
        profile: {
          department,
        },
      };
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
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true,
                designation: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/attendance - Check-in or Check-out with Geolocation, Geofencing, Shift Rules & Overtime
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      action = "auto",
      notes,
      targetUserId,
      latitude,
      longitude,
      shiftType = "GENERAL",
    } = body;

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";
    const effectiveUserId = isPrivileged && targetUserId ? targetUserId : session.id;

    // Capture IP Address & Validate Office Network
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipCheck = validateIpAddress(clientIp);

    // Validate Geofence Location
    const geofenceCheck = validateGeofence(latitude, longitude);

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
      // 1. Perform Check-in with Shift Rules
      const shiftEvaluation = evaluateShiftCheckIn(now, shiftType);

      resultRecord = await prisma.attendanceRecord.create({
        data: {
          userId: effectiveUserId,
          date: startOfToday,
          checkIn: now,
          status: shiftEvaluation.status,
          penaltyApplied: shiftEvaluation.penaltyApplied,
          shiftType,
          workingHours: 0,
          overtimeHours: 0,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          locationName: geofenceCheck.locationLabel,
          isGeofenceVerified: geofenceCheck.isVerified,
          isIpVerified: ipCheck.isVerified,
          ipAddress: clientIp,
          notes: notes
            ? `${shiftEvaluation.notes} | Note: ${notes}`
            : shiftEvaluation.notes,
        },
      });

      auditAction = "ATTENDANCE_CHECKIN";
    } else if (!record.checkOut || action === "checkout") {
      // 2. Perform Check-out with Overtime calculation
      const checkInTime = record.checkIn ? new Date(record.checkIn) : now;
      const checkoutEvaluation = evaluateShiftCheckOut(checkInTime, now, record.status);

      resultRecord = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkOut: now,
          workingHours: checkoutEvaluation.workingHours,
          overtimeHours: checkoutEvaluation.overtimeHours,
          status: checkoutEvaluation.finalStatus,
          latitude: latitude ? Number(latitude) : record.latitude,
          longitude: longitude ? Number(longitude) : record.longitude,
          locationName: geofenceCheck.locationLabel || record.locationName,
          isGeofenceVerified: geofenceCheck.isVerified || record.isGeofenceVerified,
          notes: notes
            ? `${record.notes || ""}; ${checkoutEvaluation.notesAddition}; Note: ${notes}`.trim()
            : `${record.notes || ""}; ${checkoutEvaluation.notesAddition}`.trim(),
        },
      });

      auditAction = "ATTENDANCE_CHECKOUT";
    } else {
      return NextResponse.json(
        { error: "Attendance punch already completed for today", record },
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
        shiftType: resultRecord.shiftType,
        workingHours: resultRecord.workingHours,
        overtimeHours: resultRecord.overtimeHours,
        isGeofenceVerified: resultRecord.isGeofenceVerified,
        locationName: resultRecord.locationName,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      message:
        auditAction === "ATTENDANCE_CHECKIN"
          ? `Check-in recorded (${resultRecord.status}) - ${geofenceCheck.locationLabel}`
          : `Check-out recorded (${resultRecord.workingHours} hrs, ${resultRecord.overtimeHours} hrs OT)`,
      record: resultRecord,
    });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to record attendance punch" }, { status: 500 });
  }
}

// PUT /api/attendance - Manual Attendance Adjustment & Ledger Override
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json(
        { error: "Forbidden: Only HR and Admin can manually adjust attendance records" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      userId,
      date,
      checkIn,
      checkOut,
      status = "PRESENT",
      shiftType = "GENERAL",
      workingHours = 8.5,
      overtimeHours = 0.0,
      notes,
    } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: "User ID and Date are required for attendance adjustment" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    const normalizedDate = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate())
    );

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    const record = await prisma.attendanceRecord.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status,
        shiftType,
        workingHours: Number(workingHours),
        overtimeHours: Number(overtimeHours),
        notes: notes ? `[Admin Adjusted by ${session.email}]: ${notes}` : `Adjusted by ${session.email}`,
      },
      create: {
        userId,
        date: normalizedDate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status,
        shiftType,
        workingHours: Number(workingHours),
        overtimeHours: Number(overtimeHours),
        notes: notes ? `[Admin Created by ${session.email}]: ${notes}` : `Created by ${session.email}`,
      },
      include: {
        user: {
          select: {
            email: true,
            profile: true,
          },
        },
      },
    });

    await createAuditLog({
      actorId: session.id,
      action: "ATTENDANCE_MANUAL_ADJUST",
      entity: "AttendanceRecord",
      entityId: record.id,
      details: {
        targetUserId: userId,
        adjustedDate: normalizedDate,
        status,
        shiftType,
        workingHours,
        overtimeHours,
        notes,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: "Attendance ledger entry successfully updated",
      record,
    });
  } catch (error) {
    console.error("PUT /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to manually adjust attendance" }, { status: 500 });
  }
}
