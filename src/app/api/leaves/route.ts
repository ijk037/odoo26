import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

// GET /api/leaves - List leave requests (Role-restricted)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const leaveType = searchParams.get("leaveType");
    const userId = searchParams.get("userId");

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    const where: any = {};

    // Strict RBAC: standard employee only sees their own leave requests
    if (!isPrivileged) {
      where.userId = session.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    const leaves = await prisma.leaveRequest.findMany({
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
                designation: true,
              },
            },
          },
        },
        approver: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error("GET /api/leaves error:", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

// POST /api/leaves - Apply for a new leave
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leaveType, startDate, endDate, reason } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Please provide leave type, start date, end date, and reason" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { error: "End date cannot be prior to start date" },
        { status: 400 }
      );
    }

    // Calculate days count
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: session.id,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount: daysDiff,
        reason: reason.trim(),
        status: "PENDING",
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
      action: "LEAVE_APPLY",
      entity: "LeaveRequest",
      entityId: leave.id,
      details: { leaveType, daysCount: daysDiff, startDate, endDate },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ message: "Leave request submitted successfully", leave }, { status: 201 });
  } catch (error) {
    console.error("POST /api/leaves error:", error);
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 });
  }
}

// PATCH /api/leaves - Approve or Reject leave request (HR & Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json(
        { error: "Forbidden: Only HR and Admin can approve or reject leaves" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { leaveId, status, rejectionReason } = body;

    if (!leaveId || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid parameters. status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const existingLeave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!existingLeave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        approverId: session.id,
        rejectionReason: status === "REJECTED" ? rejectionReason || "Not approved" : null,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
      include: {
        user: {
          select: {
            email: true,
            profile: true,
          },
        },
        approver: {
          select: {
            profile: true,
          },
        },
      },
    });

    await createAuditLog({
      actorId: session.id,
      action: status === "APPROVED" ? "LEAVE_APPROVE" : "LEAVE_REJECT",
      entity: "LeaveRequest",
      entityId: leaveId,
      details: {
        targetUserId: existingLeave.userId,
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave: updatedLeave,
    });
  } catch (error) {
    console.error("PATCH /api/leaves error:", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}
