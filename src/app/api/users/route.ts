import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/audit";

// GET /api/users - List users (RBAC: Admin & HR see all, Employee sees only self)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // Enforce data visibility strictly to role
    if (!isPrivileged) {
      const selfUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          salaryStructure: true,
        },
      });
      return NextResponse.json({ users: selfUser ? [selfUser] : [] });
    }

    // Build filter for Admin/HR
    const where: any = {};
    if (department) {
      where.profile = { ...where.profile, department };
    }
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { firstName: { contains: search } } },
        { profile: { lastName: { contains: search } } },
        { profile: { employeeId: { contains: search } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        salaryStructure: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create a new user (Admin / HR only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Only Admin and HR can add employees" }, { status: 403 });
    }

    const body = await req.json();
    const {
      email,
      password,
      role = "EMPLOYEE",
      firstName,
      lastName,
      department,
      designation,
      phone,
      baseSalary = 5000,
      allowances = 500,
      deductions = 400,
      joiningDate,
    } = body;

    if (!email || !password || !firstName || !lastName || !department || !designation) {
      return NextResponse.json(
        { error: "Missing required fields for employee creation" },
        { status: 400 }
      );
    }

    // HR cannot create ADMIN users
    if (session.role === "HR" && role === "ADMIN") {
      return NextResponse.json(
        { error: "HR cannot create Admin accounts" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const count = await prisma.profile.count();
    const prefix = role === "ADMIN" ? "ADM" : role === "HR" ? "HR" : "EMP";
    const employeeId = `${prefix}-${String(count + 1).padStart(3, "0")}`;

    const passwordHash = await hashPassword(password);
    const netSalary = Number(baseSalary) + Number(allowances) - Number(deductions);

    const newUser = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role,
          status: "ACTIVE",
          profile: {
            create: {
              employeeId,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              department: department.trim(),
              designation: designation.trim(),
              phone: phone ? phone.trim() : null,
              joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            },
          },
          salaryStructure: {
            create: {
              baseSalary: Number(baseSalary),
              allowances: Number(allowances),
              deductions: Number(deductions),
              netSalary,
              currency: "USD",
              paymentCycle: "MONTHLY",
              paymentMethod: "BANK_TRANSFER",
            },
          },
        },
        include: {
          profile: true,
          salaryStructure: true,
        },
      });
    });

    await createAuditLog({
      actorId: session.id,
      action: "USER_CREATE",
      entity: "User",
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role, employeeId },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ message: "Employee created successfully", user: newUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
