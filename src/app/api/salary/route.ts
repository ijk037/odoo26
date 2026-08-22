import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

// GET /api/salary - Fetch salary structures (Role-restricted)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";

    // Strict RBAC: Employee can ONLY view their own salary structure
    if (!isPrivileged) {
      const salary = await prisma.salaryStructure.findUnique({
        where: { userId: session.id },
        include: {
          user: {
            select: {
              email: true,
              profile: true,
            },
          },
        },
      });
      return NextResponse.json({ salary: salary ? [salary] : [] });
    }

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const salaries = await prisma.salaryStructure.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            status: true,
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
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ salary: salaries });
  } catch (error) {
    console.error("GET /api/salary error:", error);
    return NextResponse.json({ error: "Failed to fetch salary data" }, { status: 500 });
  }
}

// PUT /api/salary - Update or create salary structure (Admin & HR only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and HR can update salary structures" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      userId,
      baseSalary,
      allowances = 0,
      deductions = 0,
      currency = "USD",
      paymentCycle = "MONTHLY",
      paymentMethod = "BANK_TRANSFER",
      bankName,
      accountNumber,
    } = body;

    if (!userId || baseSalary === undefined) {
      return NextResponse.json(
        { error: "User ID and base salary are required" },
        { status: 400 }
      );
    }

    const numBase = Number(baseSalary);
    const numAllow = Number(allowances);
    const numDeduct = Number(deductions);
    const netSalary = Math.max(0, numBase + numAllow - numDeduct);

    const salary = await prisma.salaryStructure.upsert({
      where: { userId },
      update: {
        baseSalary: numBase,
        allowances: numAllow,
        deductions: numDeduct,
        netSalary,
        currency,
        paymentCycle,
        paymentMethod,
        bankName,
        accountNumber,
      },
      create: {
        userId,
        baseSalary: numBase,
        allowances: numAllow,
        deductions: numDeduct,
        netSalary,
        currency,
        paymentCycle,
        paymentMethod,
        bankName,
        accountNumber,
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
      action: "SALARY_UPDATE",
      entity: "SalaryStructure",
      entityId: salary.id,
      details: {
        targetUserId: userId,
        baseSalary: numBase,
        allowances: numAllow,
        deductions: numDeduct,
        netSalary,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      message: "Salary structure updated successfully",
      salary,
    });
  } catch (error) {
    console.error("PUT /api/salary error:", error);
    return NextResponse.json({ error: "Failed to update salary structure" }, { status: 500 });
  }
}
