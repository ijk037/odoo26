import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import {
  computeLeaveBalances,
  validateLeavePolicy,
  ANNUAL_LEAVE_POLICIES,
} from "@/lib/leaves/quota";

// GET /api/leaves - List leave requests with live computed quotas & balances
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const leaveType = searchParams.get("leaveType");
    const targetUserId = searchParams.get("userId");

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    const where: any = {};

    // Standard employees can ONLY view their own leave requests
    if (!isPrivileged) {
      where.userId = session.id;
    } else if (targetUserId) {
      where.userId = targetUserId;
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
        approver: {
          select: {
            id: true,
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

    // Compute live quota balances for the active user
    const userLeaves = await prisma.leaveRequest.findMany({
      where: { userId: !isPrivileged || !targetUserId ? session.id : targetUserId },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        daysCount: true,
        status: true,
      },
    });

    const balances = computeLeaveBalances(userLeaves);

    return NextResponse.json({ leaves, balances, policies: ANNUAL_LEAVE_POLICIES });
  } catch (error) {
    console.error("GET /api/leaves error:", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

// POST /api/leaves - Apply for a new leave with Smart Policy & Quota Validation
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      adminOverride = false,
      targetUserId,
    } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Please provide leave category, start date, end date, and reason remarks" },
        { status: 400 }
      );
    }

    if (reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a more descriptive reason (minimum 5 characters)" },
        { status: 400 }
      );
    }

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";
    const effectiveUserId = isPrivileged && targetUserId ? targetUserId : session.id;

    // Fetch existing leaves for this user to evaluate quota & overlaps
    const existingLeaves = await prisma.leaveRequest.findMany({
      where: { userId: effectiveUserId },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        daysCount: true,
        status: true,
      },
    });

    // Run Policy Boundary & Quota Validation
    const validation = validateLeavePolicy({
      leaveType,
      startDate,
      endDate,
      existingLeaves,
      allowPastDates: isPrivileged && adminOverride,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: effectiveUserId,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount: validation.daysCount,
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
      details: {
        leaveType,
        daysCount: validation.daysCount,
        startDate,
        endDate,
        warning: validation.warning,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json(
      {
        message: `Leave application for ${validation.daysCount} day(s) submitted successfully for review`,
        leave,
        warning: validation.warning,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/leaves error:", error);
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 });
  }
}

// PATCH /api/leaves - Approve, Reject, or Cancel leave request
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leaveId, status, rejectionReason } = body;

    if (!leaveId || !status || !["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid parameters. status must be APPROVED, REJECTED, or CANCELLED" },
        { status: 400 }
      );
    }

    const existingLeave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!existingLeave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // If cancelling, ensure user owns the leave and it's still pending
    if (status === "CANCELLED") {
      if (existingLeave.userId !== session.id && !isPrivileged) {
        return NextResponse.json(
          { error: "Forbidden: You can only cancel your own leave requests" },
          { status: 403 }
        );
      }
      if (existingLeave.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending leave requests can be cancelled directly" },
          { status: 400 }
        );
      }
    } else if (!isPrivileged) {
      // Approve / Reject requires HR or ADMIN role
      return NextResponse.json(
        { error: "Forbidden: Only HR and Admin can approve or reject leaves" },
        { status: 403 }
      );
    }

    if (status === "REJECTED" && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        { error: "Mandatory Feedback: Please provide a reason or remarks for rejecting this leave application." },
        { status: 400 }
      );
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        approverId: status === "CANCELLED" ? existingLeave.approverId : session.id,
        rejectionReason:
          status === "REJECTED"
            ? rejectionReason.trim()
            : rejectionReason || existingLeave.rejectionReason,
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

    // Auto-Sync to Attendance Ledger on Approval:
    // Automatically marks each working day within the leave window as ON_LEAVE
    if (status === "APPROVED") {
      const curDate = new Date(existingLeave.startDate);
      const stopDate = new Date(existingLeave.endDate);

      while (curDate <= stopDate) {
        const dayOfWeek = curDate.getUTCDay();
        // Skip weekend dates
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const normalizedDate = new Date(
            Date.UTC(curDate.getUTCFullYear(), curDate.getUTCMonth(), curDate.getUTCDate())
          );

          await prisma.attendanceRecord.upsert({
            where: {
              userId_date: {
                userId: existingLeave.userId,
                date: normalizedDate,
              },
            },
            update: {
              status: "ON_LEAVE",
              workingHours: 0,
              notes: `Approved ${existingLeave.leaveType} Leave (Authorized by ${session.email})`,
            },
            create: {
              userId: existingLeave.userId,
              date: normalizedDate,
              status: "ON_LEAVE",
              workingHours: 0,
              notes: `Approved ${existingLeave.leaveType} Leave (Authorized by ${session.email})`,
            },
          });
        }
        curDate.setUTCDate(curDate.getUTCDate() + 1);
      }
    }

    const auditAction =
      status === "APPROVED"
        ? "LEAVE_APPROVE"
        : status === "REJECTED"
        ? "LEAVE_REJECT"
        : "LEAVE_CANCEL";

    await createAuditLog({
      actorId: session.id,
      action: auditAction,
      entity: "LeaveRequest",
      entityId: leaveId,
      details: {
        targetUserId: existingLeave.userId,
        status,
        leaveType: existingLeave.leaveType,
        daysCount: existingLeave.daysCount,
        rejectionReason,
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

// DELETE /api/leaves - Withdraw / Cancel leave request (Immediate balance restoration)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get("id");

    if (!leaveId) {
      return NextResponse.json({ error: "Leave ID is required" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // Non-privileged users can only cancel/delete their own pending leaves
    if (!isPrivileged && leave.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own leave requests" },
        { status: 403 }
      );
    }

    if (!isPrivileged && leave.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending leave requests can be withdrawn directly" },
        { status: 400 }
      );
    }

    await prisma.leaveRequest.delete({
      where: { id: leaveId },
    });

    await createAuditLog({
      actorId: session.id,
      action: "LEAVE_WITHDRAW",
      entity: "LeaveRequest",
      entityId: leaveId,
      details: {
        userId: leave.userId,
        leaveType: leave.leaveType,
        daysCount: leave.daysCount,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: "Leave application successfully withdrawn. Quota balance restored.",
    });
  } catch (error) {
    console.error("DELETE /api/leaves error:", error);
    return NextResponse.json({ error: "Failed to delete leave request" }, { status: 500 });
  }
}
