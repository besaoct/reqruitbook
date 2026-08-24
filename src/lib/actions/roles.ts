"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission, type Permission, ALL_PERMISSIONS } from "@/lib/auth/rbac";
import { recordAuditLog } from "@/lib/security/audit";

export interface RoleWithUsers {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all dynamic roles from database with user counts
 */
export async function getRoles(): Promise<RoleWithUsers[]> {
  try {
    const roleList = await db
      .select()
      .from(roles)
      .orderBy(desc(roles.isSystem), asc(roles.name));

    // Get user counts for each role
    const allUsers = await db.select({ role: users.role }).from(users);
    const userCountMap: Record<string, number> = {};
    for (const u of allUsers) {
      userCountMap[u.role] = (userCountMap[u.role] || 0) + 1;
    }

    return roleList.map((r) => ({
      ...r,
      permissions: (r.permissions as string[]) || [],
      userCount: userCountMap[r.slug] || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return [];
  }
}

/**
 * Fetch a single role by ID
 */
export async function getRoleById(id: string) {
  try {
    const res = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!res[0]) return null;
    return {
      ...res[0],
      permissions: (res[0].permissions as string[]) || [],
    };
  } catch (error) {
    console.error("Failed to fetch role by id:", error);
    return null;
  }
}

/**
 * Fetch a single role by slug
 */
export async function getRoleBySlug(slug: string) {
  try {
    const res = await db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
    if (!res[0]) return null;
    return {
      ...res[0],
      permissions: (res[0].permissions as string[]) || [],
    };
  } catch (error) {
    console.error("Failed to fetch role by slug:", error);
    return null;
  }
}

/**
 * Create a new custom dynamic role
 */
export async function createRole(data: {
  name: string;
  slug?: string;
  description?: string;
  badge?: string;
  permissions: string[];
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthenticated");
  assertPermission(currentUser.role, "canAssignRoles", currentUser.permissions);

  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Role name is required");
  }

  // Generate or sanitize slug
  const slug = (
    data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  ).toLowerCase();

  // Check if slug already exists
  const existing = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, slug))
    .limit(1);

  if (existing[0]) {
    throw new Error(`A role with identifier '${slug}' already exists. Please choose a different name.`);
  }

  const roleId = `role_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(roles).values({
    id: roleId,
    orgId: "org_myorganisation",
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || null,
    badge: data.badge?.trim() || "Custom",
    permissions: data.permissions || [],
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await recordAuditLog({
    actorId: currentUser.id,
    action: "rbac.role_created",
    entityType: "role",
    entityId: roleId,
    metadata: { name: data.name, slug, permissions: data.permissions },
  });

  revalidatePath("/settings");
  return { success: true, id: roleId, slug };
}

/**
 * Update an existing role's metadata or permissions array
 */
export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
    badge?: string;
    permissions?: string[];
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthenticated");
  assertPermission(currentUser.role, "canAssignRoles", currentUser.permissions);

  const existing = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!existing[0]) {
    throw new Error("Role not found");
  }

  if (existing[0].slug === "system_admin") {
    throw new Error("The root System Administrator role is strictly read-only and immutable for everyone (including System Admin).");
  }

  const updatePayload: Partial<typeof roles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.description !== undefined) updatePayload.description = data.description.trim();
  if (data.badge !== undefined) updatePayload.badge = data.badge.trim();
  if (data.permissions !== undefined) updatePayload.permissions = data.permissions;

  await db.update(roles).set(updatePayload).where(eq(roles.id, id));

  await recordAuditLog({
    actorId: currentUser.id,
    action: "rbac.role_updated",
    entityType: "role",
    entityId: id,
    metadata: { roleName: existing[0].name, updates: data },
  });

  revalidatePath("/settings");
  return { success: true };
}

/**
 * 1-Click toggle of an individual permission for a role (used in dynamic RBAC matrix)
 */
export async function toggleRolePermission(
  roleId: string,
  permissionKey: Permission,
  granted: boolean,
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthenticated");
  assertPermission(currentUser.role, "canAssignRoles", currentUser.permissions);

  const roleList = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!roleList[0]) {
    throw new Error("Role not found");
  }

  // Immutable root System Admin protection
  if (roleList[0].slug === "system_admin") {
    throw new Error("The System Administrator root role retains all system permissions and cannot be modified.");
  }

  const currentPermissions = new Set((roleList[0].permissions as string[]) || []);

  if (granted) {
    currentPermissions.add(permissionKey);
  } else {
    currentPermissions.delete(permissionKey);
  }

  const updatedArray = Array.from(currentPermissions);

  await db
    .update(roles)
    .set({
      permissions: updatedArray,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, roleId));

  await recordAuditLog({
    actorId: currentUser.id,
    action: granted ? "rbac.permission_granted" : "rbac.permission_revoked",
    entityType: "role",
    entityId: roleId,
    metadata: { roleName: roleList[0].name, permission: permissionKey, granted },
  });

  revalidatePath("/settings");
  return { success: true, permissions: updatedArray };
}

/**
 * Delete a custom role
 */
export async function deleteRole(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthenticated");
  assertPermission(currentUser.role, "canAssignRoles", currentUser.permissions);

  const roleList = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!roleList[0]) {
    throw new Error("Role not found");
  }

  if (roleList[0].slug === "system_admin" || roleList[0].isSystem) {
    throw new Error("System default roles cannot be deleted. You can create, edit, or delete custom roles instead.");
  }

  // Check if any users have this role
  const assignedUsers = await db
    .select({ count: users.id })
    .from(users)
    .where(eq(users.role, roleList[0].slug));

  if (assignedUsers.length > 0) {
    throw new Error(
      `Cannot delete role '${roleList[0].name}' because ${assignedUsers.length} user(s) are currently assigned to it. Please reassign them to another role first.`,
    );
  }

  await db.delete(roles).where(eq(roles.id, id));

  await recordAuditLog({
    actorId: currentUser.id,
    action: "rbac.role_deleted",
    entityType: "role",
    entityId: id,
    metadata: { roleName: roleList[0].name, slug: roleList[0].slug },
  });

  revalidatePath("/settings");
  return { success: true };
}
