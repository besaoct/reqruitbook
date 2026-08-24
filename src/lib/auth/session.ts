import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, organizations, roles } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/auth/rbac";

export const SESSION_COOKIE_NAME = "reqruitbook_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hashes raw token with SHA-256 for secure database storage
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface AuthUser {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  roleLabel?: string;
  permissions: string[];
  departmentId: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  organizationName: string;
}

/**
 * Creates an active cryptographically secure session and sets the HttpOnly cookie
 */
export async function createSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string },
): Promise<{ token: string; expiresAt: Date }> {
  // Generate 32-byte cryptographic random session token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const sessionId = `ses_${randomBytes(12).toString("hex")}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    tokenHash,
    ipAddress: metadata?.ipAddress || null,
    userAgent: metadata?.userAgent || null,
    expiresAt,
  });

  // Set hardened HttpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token: rawToken, expiresAt };
}

/**
 * Validates a session token string and returns the associated active user with dynamic permissions
 */
export async function validateSessionToken(token: string): Promise<AuthUser | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  // Look up unexpired session with user, organization, and dynamic role
  const [foundSession] = await db
    .select({
      session: sessions,
      user: users,
      org: organizations,
      roleData: roles,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(organizations, eq(users.orgId, organizations.id))
    .leftJoin(
      roles,
      and(
        eq(roles.orgId, users.orgId),
        eq(roles.slug, users.role),
      ),
    )
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  if (!foundSession) {
    return null;
  }

  // Resolve dynamic permissions from DB role or fallback
  const userRole = foundSession.user.role;
  let dynamicPermissions: string[] = [];

  if (foundSession.roleData?.permissions && Array.isArray(foundSession.roleData.permissions)) {
    dynamicPermissions = foundSession.roleData.permissions as string[];
  } else if (DEFAULT_ROLE_PERMISSIONS[userRole]) {
    dynamicPermissions = DEFAULT_ROLE_PERMISSIONS[userRole] as string[];
  }

  // If system_admin, ensure all permissions are granted
  if (userRole === "system_admin" && dynamicPermissions.length === 0) {
    dynamicPermissions = DEFAULT_ROLE_PERMISSIONS.system_admin as string[];
  }

  return {
    id: foundSession.user.id,
    orgId: foundSession.user.orgId,
    name: foundSession.user.name,
    email: foundSession.user.email,
    role: foundSession.user.role,
    roleLabel:
      foundSession.roleData?.name ||
      foundSession.user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    permissions: dynamicPermissions,
    departmentId: foundSession.user.departmentId,
    avatarUrl: foundSession.user.avatarUrl,
    isActive: foundSession.user.isActive,
    organizationName: foundSession.org.name,
  };
}

/**
 * Server-side helper to get current authenticated user from request cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await validateSessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Destroys the active session and clears the cookie
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = hashToken(token);
      await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch (err) {
    console.error("Error destroying session:", err);
  }
}
