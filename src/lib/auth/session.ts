import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "./jwt";
import prisma from "../prisma";
import { Role, UserSession } from "@/types";

export async function getSessionUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as Role,
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
    };
  } catch (error) {
    console.error("Error retrieving session user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<UserSession> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
