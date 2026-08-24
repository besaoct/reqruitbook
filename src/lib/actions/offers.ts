"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { offers, candidates, jobApplications, jobOpenings, auditLogs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/rbac";
import { recordAuditLog } from "@/lib/security/audit";

export async function getOffers(params?: {
  status?: string;
}) {
  try {
    const conditions = [];
    if (params?.status && params.status !== "all") {
      conditions.push(eq(offers.status, params.status as any));
    }

    const offerList = await db
      .select({
        id: offers.id,
        designation: offers.designation,
        departmentName: offers.departmentName,
        baseSalary: offers.baseSalary,
        currency: offers.currency,
        joiningDate: offers.joiningDate,
        reportingManager: offers.reportingManager,
        workLocation: offers.workLocation,
        benefitsSummary: offers.benefitsSummary,
        offerLetterContent: offers.offerLetterContent,
        status: offers.status,
        hrmSynced: offers.hrmSynced,
        hrmSyncedAt: offers.hrmSyncedAt,
        expiresAt: offers.expiresAt,
        createdAt: offers.createdAt,
        updatedAt: offers.updatedAt,
        applicationId: jobApplications.id,
        candidateId: candidates.id,
        candidateName: candidates.fullName,
        candidateEmail: candidates.email,
        candidatePhone: candidates.phone,
        jobId: jobOpenings.id,
        jobTitle: jobOpenings.title,
      })
      .from(offers)
      .leftJoin(jobApplications, eq(offers.applicationId, jobApplications.id))
      .leftJoin(candidates, eq(offers.candidateId, candidates.id))
      .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(offers.createdAt));

    return offerList;
  } catch (error) {
    console.error("Failed to fetch offers:", error);
    return [];
  }
}

export async function createOffer(data: {
  applicationId: string;
  candidateId: string;
  designation: string;
  departmentName: string;
  baseSalary: number;
  currency?: string;
  joiningDate: string;
  reportingManager?: string;
  workLocation?: string;
  benefitsSummary?: string;
  offerLetterContent?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canCreateOffers", user.permissions);

  const newId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(offers).values({
    id: newId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    designation: data.designation,
    departmentName: data.departmentName,
    baseSalary: data.baseSalary,
    currency: data.currency || "USD",
    joiningDate: data.joiningDate,
    reportingManager: data.reportingManager || "Engineering Director",
    workLocation: data.workLocation || "San Francisco HQ / Hybrid",
    benefitsSummary: data.benefitsSummary || "Comprehensive Medical, Dental, 401(k) 4% Match, $3,000 Annual Learning Stipend",
    offerLetterContent: data.offerLetterContent || `Dear Candidate, We are pleased to extend this formal offer of employment for the position of ${data.designation} at My Organisation.`,
    status: "draft",
    hrmSynced: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Advance application stage to 'offer'
  await db
    .update(jobApplications)
    .set({ stage: "offer", updatedAt: new Date() })
    .where(eq(jobApplications.id, data.applicationId));

  await recordAuditLog({
    actorId: user.id,
    action: "offer.created",
    entityType: "offer",
    entityId: newId,
    metadata: {
      applicationId: data.applicationId,
      candidateId: data.candidateId,
      designation: data.designation,
      baseSalary: data.baseSalary,
      currency: data.currency || "USD",
    },
  });

  revalidatePath("/offers");
  revalidatePath("/applications");
  revalidatePath("/dashboard");

  return { success: true, id: newId };
}

export async function updateOfferStatus(
  id: string,
  status: "draft" | "pending_approval" | "approved" | "sent" | "accepted" | "declined" | "expired",
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");

  if (status === "approved") {
    assertPermission(user.role, "canApproveOffers", user.permissions);
  }

  await db
    .update(offers)
    .set({ status, updatedAt: new Date() })
    .where(eq(offers.id, id));

  await recordAuditLog({
    actorId: user.id,
    action: `offer.status_${status}`,
    entityType: "offer",
    entityId: id,
    metadata: { newStatus: status, updatedBy: user.name },
  });

  // If accepted, update application to 'selected' or 'offer'
  if (status === "accepted") {
    const offer = await db.select({ applicationId: offers.applicationId }).from(offers).where(eq(offers.id, id)).limit(1);
    if (offer[0]?.applicationId) {
      await db
        .update(jobApplications)
        .set({ stage: "selected", updatedAt: new Date() })
        .where(eq(jobApplications.id, offer[0].applicationId));
    }
  }

  revalidatePath("/offers");
  revalidatePath("/applications");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function syncOfferToHRM(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canSyncHRM", user.permissions);

  const offerList = await db
    .select({
      id: offers.id,
      designation: offers.designation,
      departmentName: offers.departmentName,
      baseSalary: offers.baseSalary,
      joiningDate: offers.joiningDate,
      candidateId: offers.candidateId,
      applicationId: offers.applicationId,
      candidateName: candidates.fullName,
      candidateEmail: candidates.email,
    })
    .from(offers)
    .leftJoin(candidates, eq(offers.candidateId, candidates.id))
    .where(eq(offers.id, id))
    .limit(1);

  const offer = offerList[0];
  if (!offer) throw new Error("Offer not found");

  const now = new Date();

  // 1. Mark offer as HRM synced and accepted
  await db
    .update(offers)
    .set({
      status: "accepted",
      hrmSynced: true,
      hrmSyncedAt: now,
      updatedAt: now,
    })
    .where(eq(offers.id, id));

  // 2. Mark application as 'hired'
  if (offer.applicationId) {
    await db
      .update(jobApplications)
      .set({
        stage: "hired",
        hiredAt: now,
        updatedAt: now,
      })
      .where(eq(jobApplications.id, offer.applicationId));
  }

  // 3. Record in audit logs
  await db.insert(auditLogs).values({
    id: `log_${Date.now()}`,
    orgId: "org_myorganisation",
    actorId: user.id,
    action: "HRM_EMPLOYEE_ONBOARDED",
    entityType: "offer",
    entityId: id,
    metadata: {
      candidateName: offer.candidateName,
      candidateEmail: offer.candidateEmail,
      designation: offer.designation,
      department: offer.departmentName,
      joiningDate: offer.joiningDate,
      syncedBy: user.name,
    },
    createdAt: now,
  });

  revalidatePath("/offers");
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath("/candidates");

  return {
    success: true,
    candidateName: offer.candidateName,
    designation: offer.designation,
    syncedAt: now.toISOString(),
  };
}

export async function deleteOffer(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canCreateOffers");

  await db.delete(offers).where(eq(offers.id, id));

  revalidatePath("/offers");
  return { success: true };
}
