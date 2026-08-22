import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { resolveReconciliationDates } from "@/features/attendance/lopNormalizer";

// POST /api/attendance/reconcile/resolve - HR Resolution for flagged attendance dates
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPrivileged = session.role === "ADMIN" || session.role === "HR";
    if (!isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden: Only HR and Admin can resolve attendance reconciliation records" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      employeeId,
      userId,
      date,
      dates,
      resolution = "EXCUSED",
      status,
      action,
      reason,
      notes,
    } = body;

    const targetEmployeeId = employeeId || userId;
    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: "employeeId or userId is required" },
        { status: 400 }
      );
    }

    const targetDates = dates || (date ? [date] : []);
    if (!targetDates || targetDates.length === 0) {
      return NextResponse.json(
        { error: "At least one date is required to resolve" },
        { status: 400 }
      );
    }

    const finalResolution = resolution || status || action || "EXCUSED";
    const finalReason = reason || notes || "";

    const result = await resolveReconciliationDates({
      employeeId: targetEmployeeId,
      dates: Array.isArray(targetDates) ? targetDates : [targetDates],
      resolution: finalResolution,
      reason: finalReason,
      actorId: session.id,
    });

    return NextResponse.json({
      message: `Successfully resolved ${result.count} attendance date(s) as ${result.resolution}`,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/reconcile/resolve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve attendance reconciliation" },
      { status: 500 }
    );
  }
}
