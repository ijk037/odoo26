import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

// GET /api/users/[id] - Fetch detailed employee dossier
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // Non-privileged users can only view their own dossier
    if (!isPrivileged && session.id !== id) {
      return NextResponse.json({ error: "Forbidden: Access restricted to self" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        salaryStructure: true,
        attendanceRecords: {
          orderBy: { date: "desc" },
          take: 30,
        },
        leaveRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch employee details" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update employee details (Admin / HR only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Only Admin and HR can modify workforce details" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      firstName,
      lastName,
      department,
      designation,
      role,
      status,
      phone,
      baseSalary,
      allowances,
      deductions,
    } = body;

    // HR cannot escalate privileges to ADMIN
    if (session.role === "HR" && role === "ADMIN") {
      return NextResponse.json({ error: "HR Managers cannot assign Super Administrator role" }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, salaryStructure: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    // Atomic update
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update User core
      const user = await tx.user.update({
        where: { id },
        data: {
          role: role !== undefined ? role : undefined,
          status: status !== undefined ? status : undefined,
        },
      });

      // 2. Update Profile
      if (firstName || lastName || department || designation || phone !== undefined) {
        await tx.profile.update({
          where: { userId: id },
          data: {
            firstName: firstName !== undefined ? firstName.trim() : undefined,
            lastName: lastName !== undefined ? lastName.trim() : undefined,
            department: department !== undefined ? department.trim() : undefined,
            designation: designation !== undefined ? designation.trim() : undefined,
            phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
          },
        });
      }

      // 3. Update Salary structure if provided
      if (baseSalary !== undefined || allowances !== undefined || deductions !== undefined) {
        const numBase = baseSalary !== undefined ? Number(baseSalary) : existingUser.salaryStructure?.baseSalary || 5000;
        const numAllow = allowances !== undefined ? Number(allowances) : existingUser.salaryStructure?.allowances || 0;
        const numDeduct = deductions !== undefined ? Number(deductions) : existingUser.salaryStructure?.deductions || 0;
        const netSalary = Math.max(0, numBase + numAllow - numDeduct);

        await tx.salaryStructure.upsert({
          where: { userId: id },
          update: {
            baseSalary: numBase,
            allowances: numAllow,
            deductions: numDeduct,
            netSalary,
          },
          create: {
            userId: id,
            baseSalary: numBase,
            allowances: numAllow,
            deductions: numDeduct,
            netSalary,
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: { profile: true, salaryStructure: true },
      });
    });

    await createAuditLog({
      actorId: session.id,
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      details: {
        targetEmail: existingUser.email,
        updatedFields: { firstName, lastName, department, designation, role, status, baseSalary },
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: "Employee profile and employment record updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update employee details" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Remove employee record (Admin / HR only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Only Admin and HR can remove workforce records" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting self
    if (session.id === id) {
      return NextResponse.json({ error: "Cannot delete your own active administrator account" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // HR cannot delete ADMIN accounts
    if (session.role === "HR" && targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "HR Managers cannot delete Super Administrator accounts" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id },
    });

    await createAuditLog({
      actorId: session.id,
      action: "USER_DELETE",
      entity: "User",
      entityId: id,
      details: {
        deletedEmail: targetUser.email,
        deletedRole: targetUser.role,
        employeeId: targetUser.profile?.employeeId,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ message: "Employee record removed successfully" });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
