import { SignJWT, jwtVerify } from "jose";
import { JWTPayload, Role } from "@/types";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "dayflow_hrms_super_secret_jwt_key_2026_production_grade_token_string";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_COOKIE_NAME = "dayflow_session_token";
export const TOKEN_EXPIRY_DAYS = 7;

export async function signToken(payload: {
  sub: string;
  email: string;
  role: Role;
  name: string;
  employeeId?: string;
}): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * TOKEN_EXPIRY_DAYS; // 7 days

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setSubject(payload.sub)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export const authCookieOptions = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * TOKEN_EXPIRY_DAYS, // 7 days
};
