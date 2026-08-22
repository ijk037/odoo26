import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken, authCookieOptions } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      department,
      designation,
      phone,
      role: requestedRole,
    } = body;

    if (!email || !password || !firstName || !lastName || !department || !designation) {
      return NextResponse.json(
        { error: "Please fill in all required fields (email, password, name, department, designation)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Default new signups to EMPLOYEE unless first user or explicit allowed role
    const totalUsers = await prisma.user.count();
    const assignedRole: Role = totalUsers === 0 ? "ADMIN" : (requestedRole === "HR" || requestedRole === "ADMIN" ? requestedRole : "EMPLOYEE");

    // Generate unique employee ID
    const count = await prisma.profile.count();
    const prefix = assignedRole === "ADMIN" ? "ADM" : assignedRole === "HR" ? "HR" : "EMP";
    const employeeId = `${prefix}-${String(count + 1).padStart(3, "0")}`;

    const passwordHash = await hashPassword(password);

    // Create User, Profile and default Salary in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: assignedRole,
          status: "ACTIVE",
          profile: {
            create: {
              employeeId,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              department: department.trim(),
              designation: designation.trim(),
              phone: phone ? phone.trim() : null,
              joiningDate: new Date(),
            },
          },
          salaryStructure: {
            create: {
              baseSalary: assignedRole === "ADMIN" ? 8500 : assignedRole === "HR" ? 6000 : 4500,
              allowances: 500,
              deductions: 400,
              netSalary: assignedRole === "ADMIN" ? 8600 : assignedRole === "HR" ? 6100 : 4600,
              currency: "USD",
              paymentCycle: "MONTHLY",
              paymentMethod: "BANK_TRANSFER",
            },
          },
        },
        include: {
          profile: true,
        },
      });

      return user;
    });

    await createAuditLog({
      actorId: newUser.id,
      action: "USER_REGISTER",
      entity: "User",
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role, employeeId },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const fullName = `${newUser.profile?.firstName} ${newUser.profile?.lastName}`;

    const token = await signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role as Role,
      name: fullName,
      employeeId: newUser.profile?.employeeId,
    });

    const response = NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          profile: newUser.profile
            ? {
                id: newUser.profile.id,
                employeeId: newUser.profile.employeeId,
                firstName: newUser.profile.firstName,
                lastName: newUser.profile.lastName,
                department: newUser.profile.department,
                designation: newUser.profile.designation,
                phone: newUser.profile.phone,
                avatarUrl: newUser.profile.avatarUrl,
                address: newUser.profile.address,
                emergencyContact: newUser.profile.emergencyContact,
                joiningDate: newUser.profile.joiningDate,
                gender: newUser.profile.gender,
              }
            : null,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      ...authCookieOptions,
      value: token,
    });

    return response;
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during user registration" },
      { status: 500 }
    );
  }
}
