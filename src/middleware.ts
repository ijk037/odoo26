import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "dayflow_hrms_super_secret_jwt_key_2026_production_grade_token_string";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

// Define protected route patterns and their allowed roles
const PROTECTED_ROUTES: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/audit-logs/, roles: ["ADMIN"] },
  { pattern: /^\/employees/, roles: ["ADMIN", "HR"] },
  { pattern: /^\/payroll\/manage/, roles: ["ADMIN", "HR"] },
  { pattern: /^\/dashboard/, roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { pattern: /^\/attendance/, roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { pattern: /^\/leaves/, roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { pattern: /^\/payroll/, roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { pattern: /^\/profile/, roles: ["ADMIN", "HR", "EMPLOYEE"] },
];

export async function middleware(request: any) {
  const { pathname } = request.nextUrl;

  // Skip static assets, next internal files, and public api endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check if current path matches any protected route rule
  const matchedRoute = PROTECTED_ROUTES.find((route) => route.pattern.test(pathname));

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const userRole = (payload.role as string) || "EMPLOYEE";

    // If route requires specific roles, enforce RBAC
    if (matchedRoute) {
      const isAllowed = matchedRoute.roles.includes(userRole);
      if (!isAllowed) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.sub as string);
    response.headers.set("x-user-role", userRole);
    response.headers.set("x-user-email", payload.email as string);

    return response;
  } catch (error) {
    console.error("Middleware JWT verification failed:", error);
    // If token is expired or tampered, clear cookie and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/leaves/:path*",
    "/payroll/:path*",
    "/profile/:path*",
    "/audit-logs/:path*",
    "/api/users/:path*",
    "/api/attendance/:path*",
    "/api/leaves/:path*",
    "/api/salary/:path*",
    "/api/audit-logs/:path*",
  ],
};
