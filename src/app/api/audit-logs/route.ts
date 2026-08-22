import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

// GET /api/audit-logs - Fetch system audit logs (Admin strictly only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Administrators can view audit logs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const limit = Math.min(100, Number(searchParams.get("limit") || 50));

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
