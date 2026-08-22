import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

// GET /api/profile - Fetch personal profile with salary structure
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        salaryStructure: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        profile: user.profile,
        salaryStructure: user.salaryStructure,
      },
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/profile - Update personal profile with RESTRICTED field editing
// Only allows updates to: phone, address, emergencyContact, avatarUrl, gender
// Job titles, department, employeeId, salary, and role are strictly locked
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, address, emergencyContact, avatarUrl, gender } = body;

    // Reject attempt to modify restricted fields
    if (
      body.role !== undefined ||
      body.department !== undefined ||
      body.designation !== undefined ||
      body.employeeId !== undefined ||
      body.baseSalary !== undefined ||
      body.netSalary !== undefined
    ) {
      return NextResponse.json(
        {
          error: "Permission Denied: Employment parameters (Role, Department, Designation, Salary, Employee ID) are locked and can only be modified by Human Resources / Super Admin.",
        },
        { status: 403 }
      );
    }

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.id },
      data: {
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        address: address !== undefined ? (address ? address.trim() : null) : undefined,
        emergencyContact: emergencyContact !== undefined ? (emergencyContact ? emergencyContact.trim() : null) : undefined,
        avatarUrl: avatarUrl !== undefined ? (avatarUrl ? avatarUrl.trim() : null) : undefined,
        gender: gender !== undefined ? gender : undefined,
      },
    });

    await createAuditLog({
      actorId: session.id,
      action: "PROFILE_UPDATE",
      entity: "Profile",
      entityId: updatedProfile.id,
      details: {
        updatedFields: {
          phone: !!phone,
          address: !!address,
          emergencyContact: !!emergencyContact,
          avatarUrl: !!avatarUrl,
          gender: !!gender,
        },
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: "Profile details updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile details" }, { status: 500 });
  }
}
