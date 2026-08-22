import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signToken, authCookieOptions } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Account is currently ${user.status.toLowerCase()}. Please contact HR/Admin.` },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await createAuditLog({
        actorId: user.id,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        details: { reason: "Incorrect password" },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const fullName = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      name: fullName,
      employeeId: user.profile?.employeeId,
    });

    await createAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile
          ? {
              id: user.profile.id,
              employeeId: user.profile.employeeId,
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              department: user.profile.department,
              designation: user.profile.designation,
              phone: user.profile.phone,
              avatarUrl: user.profile.avatarUrl,
              address: user.profile.address,
              emergencyContact: user.profile.emergencyContact,
              joiningDate: user.profile.joiningDate,
              gender: user.profile.gender,
            }
          : null,
      },
    });

    response.cookies.set({
      ...authCookieOptions,
      value: token,
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication" },
      { status: 500 }
    );
  }
}
