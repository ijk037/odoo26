// ============================================================================
// HACKATHON MODULE: API Logic
// This file contains the server-side logic for the Multi-Tier Leave Approval 
// Engine. These would normally go into your `src/app/api/...` route files.
// ============================================================================

import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma"; 
// import { auth } from "@/lib/auth";

/**
 * 1. POST /api/leaves 
 * Handles employees submitting a new leave request.
 */
export async function createLeaveRequest(req: Request) {
  /*
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { leaveType, startDate, endDate, reason } = body;

  // Calculate working days (excluding weekends)
  const totalDays = calculateWorkingDays(new Date(startDate), new Date(endDate));

  // Verify balance
  const balance = await prisma.leaveBalance.findUnique({
    where: { userId: session.user.id },
  });
  
  if (!balance) return new NextResponse("Balance not found", { status: 404 });

  // Map leaveType to balance field (e.g., 'ANNUAL_PAID' -> 'annualPaidRemaining')
  const balanceField = getBalanceField(leaveType);
  if (balance[balanceField] < totalDays) {
    return new NextResponse("Insufficient leave balance", { status: 400 });
  }

  // Create Request and Audit Log in a Transaction
  const leave = await prisma.$transaction(async (tx) => {
    const newLeave = await tx.leaveRequest.create({
      data: {
        userId: session.user.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        reason,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "LEAVE_CREATED",
        entityType: "LeaveRequest",
        entityId: newLeave.id,
        metadata: { leaveType, totalDays },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        leaveRequestId: newLeave.id,
      },
    });

    return newLeave;
  });

  return NextResponse.json(leave);
  */
}

/**
 * 2. PATCH /api/leaves/[id]
 * Handles Managers and HR approving/rejecting leave requests.
 */
export async function updateLeaveRequest(req: Request, leaveId: string) {
  /*
  const session = await auth();
  if (!session?.user || !["MANAGER", "HR", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { status, tier } = await req.json(); // tier is 'MANAGER' or 'HR'
  
  const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
  if (!leave) return new NextResponse("Not Found", { status: 404 });

  // Policy Constraints & Enforcement
  if (tier === "HR" && status === "APPROVED" && leave.managerApprovalStatus !== "APPROVED") {
    return new NextResponse("HR cannot approve until Manager approves", { status: 400 });
  }

  // Determine overall status based on multi-tier rules
  let newOverallStatus = leave.overallStatus;
  
  if (status === "REJECTED") {
    newOverallStatus = "REJECTED"; // Immediate rejection
  } else if (tier === "MANAGER" && status === "APPROVED") {
    newOverallStatus = "PENDING"; // Still waiting on HR
  } else if (tier === "HR" && status === "APPROVED" && leave.managerApprovalStatus === "APPROVED") {
    newOverallStatus = "APPROVED"; // Both tiers passed
  }

  // Transaction: Update status, write audit log, and deduct balance if final approval
  const updatedLeave = await prisma.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        ...(tier === "MANAGER" ? { managerApprovalStatus: status } : {}),
        ...(tier === "HR" ? { hrApprovalStatus: status } : {}),
        overallStatus: newOverallStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `LEAVE_${tier}_${status}`,
        entityType: "LeaveRequest",
        entityId: leaveId,
        metadata: { oldStatus: leave.overallStatus, newStatus: newOverallStatus },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        leaveRequestId: leaveId,
      },
    });

    // Deduct balance if final approval is reached
    if (newOverallStatus === "APPROVED" && leave.overallStatus !== "APPROVED") {
      const balanceField = getBalanceField(leave.leaveType);
      await tx.leaveBalance.update({
        where: { userId: leave.userId },
        data: { [balanceField]: { decrement: leave.totalDays } },
      });
    }

    return updated;
  });

  return NextResponse.json(updatedLeave);
  */
}

/**
 * 3. GET /api/audit-logs
 * Fetch immutable audit trail (Admin/HR only)
 */
export async function fetchAuditLogs() {
  /*
  const session = await auth();
  if (!session?.user || !["HR", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { name: true, email: true, role: true } },
      leaveRequest: { select: { leaveType: true, user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(logs);
  */
}

// Helper
function getBalanceField(type: string): string {
  if (type === "ANNUAL_PAID") return "annualPaidRemaining";
  if (type === "SICK") return "sickRemaining";
  if (type === "CASUAL") return "casualRemaining";
  if (type === "MATERNITY_PATERNITY") return "maternityPaternityRemaining";
  throw new Error("Invalid leave type");
}
