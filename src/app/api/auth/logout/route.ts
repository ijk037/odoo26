import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      await createAuditLog({
        actorId: user.id,
        action: "AUTH_LOGOUT",
        entity: "User",
        entityId: user.id,
        details: { email: user.email },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
    }

    const response = NextResponse.json({ message: "Successfully logged out" });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
