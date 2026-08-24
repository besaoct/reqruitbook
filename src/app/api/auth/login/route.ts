import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users, organizations, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/security/rate-limiter";
import { recordAuditLog } from "@/lib/security/audit";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid corporate email address"),
  password: z.string().min(1, "Password is required"),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. Sliding-window rate limit check for login (Max 5 attempts/min per IP)
    const rateLimit = checkRateLimit(
      `auth_login:${clientIp}`,
      RATE_LIMIT_CONFIGS.AUTH.limit,
      RATE_LIMIT_CONFIGS.AUTH.windowMs,
    );

    if (!rateLimit.allowed) {
      await recordAuditLog({
        action: "auth.rate_limit_exceeded",
        entityType: "ip_address",
        entityId: clientIp,
        metadata: { clientIp, retryAfter: rateLimit.retryAfter },
      });

      return NextResponse.json(
        {
          error: `Too many authentication attempts. Please retry in ${rateLimit.retryAfter} second(s).`,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user by email with dynamic role permissions
    const [foundUser] = await db
      .select({
        user: users,
        org: organizations,
        roleData: roles,
      })
      .from(users)
      .innerJoin(organizations, eq(users.orgId, organizations.id))
      .leftJoin(
        roles,
        and(
          eq(roles.orgId, users.orgId),
          eq(roles.slug, users.role),
        ),
      )
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const now = new Date();

    // Check account lockout
    if (foundUser?.user.lockedUntil && foundUser.user.lockedUntil > now) {
      const remainingMinutes = Math.ceil(
        (foundUser.user.lockedUntil.getTime() - now.getTime()) / 60000,
      );

      await recordAuditLog({
        actorId: foundUser.user.id,
        orgId: foundUser.user.orgId,
        action: "auth.attempt_locked_account",
        entityType: "user",
        entityId: foundUser.user.id,
        metadata: { email: normalizedEmail, clientIp, remainingMinutes },
      });

      return NextResponse.json(
        {
          error: `Account temporarily locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    // Verify password with constant-time scrypt verification
    const isValid = await verifyPassword(
      password,
      foundUser?.user.passwordHash,
    );

    if (!foundUser || !isValid || !foundUser.user.isActive) {
      if (foundUser) {
        const nextAttempts = foundUser.user.failedLoginAttempts + 1;
        const willLock = nextAttempts >= MAX_FAILED_ATTEMPTS;

        await db
          .update(users)
          .set({
            failedLoginAttempts: nextAttempts,
            lockedUntil: willLock
              ? new Date(now.getTime() + LOCKOUT_MINUTES * 60000)
              : null,
          })
          .where(eq(users.id, foundUser.user.id));

        if (willLock) {
          await recordAuditLog({
            actorId: foundUser.user.id,
            orgId: foundUser.user.orgId,
            action: "auth.account_locked",
            entityType: "user",
            entityId: foundUser.user.id,
            metadata: {
              email: normalizedEmail,
              clientIp,
              lockoutDurationMinutes: LOCKOUT_MINUTES,
            },
          });
        } else {
          await recordAuditLog({
            actorId: foundUser.user.id,
            orgId: foundUser.user.orgId,
            action: "auth.login_failed",
            entityType: "user",
            entityId: foundUser.user.id,
            metadata: {
              email: normalizedEmail,
              clientIp,
              consecutiveFailures: nextAttempts,
            },
          });
        }
      } else {
        await recordAuditLog({
          action: "auth.unknown_user_attempt",
          entityType: "user",
          entityId: normalizedEmail,
          metadata: { email: normalizedEmail, clientIp },
        });
      }

      // Generic authentication error to prevent email harvesting
      return NextResponse.json(
        { error: "Invalid email or password." },
        {
          status: 401,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    // Reset failed login attempts on successful sign-in
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      })
      .where(eq(users.id, foundUser.user.id));

    // Extract client metadata
    const userAgent = req.headers.get("user-agent") || undefined;

    // Create session and set HttpOnly cookie
    await createSession(foundUser.user.id, {
      ipAddress: clientIp,
      userAgent,
    });

    // Record audit log for successful login
    await recordAuditLog({
      actorId: foundUser.user.id,
      orgId: foundUser.user.orgId,
      action: "auth.login_success",
      entityType: "user",
      entityId: foundUser.user.id,
      metadata: { email: normalizedEmail, clientIp, userAgent },
    });

    // Resolve dynamic permissions
    const userRole = foundUser.user.role;
    let dynamicPermissions: string[] = [];
    if (foundUser.roleData?.permissions && Array.isArray(foundUser.roleData.permissions)) {
      dynamicPermissions = foundUser.roleData.permissions as string[];
    } else if (DEFAULT_ROLE_PERMISSIONS[userRole]) {
      dynamicPermissions = DEFAULT_ROLE_PERMISSIONS[userRole] as string[];
    }
    if (userRole === "system_admin" && dynamicPermissions.length === 0) {
      dynamicPermissions = DEFAULT_ROLE_PERMISSIONS.system_admin as string[];
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: foundUser.user.id,
          name: foundUser.user.name,
          email: foundUser.user.email,
          role: foundUser.user.role,
          permissions: dynamicPermissions,
          departmentId: foundUser.user.departmentId,
          avatarUrl: foundUser.user.avatarUrl,
          organizationName: foundUser.org.name,
        },
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      },
    );
  } catch (err) {
    console.error("Login authentication error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 },
    );
  }
}
