"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { candidates, jobApplications, jobOpenings, interviews, interviewScorecards, offers } from "@/db/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/rbac";

export async function getCandidates(params?: {
  search?: string;
  inTalentPool?: boolean;
}) {
  try {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(candidates.fullName, `%${params.search}%`),
          ilike(candidates.email, `%${params.search}%`),
          ilike(candidates.currentDesignation, `%${params.search}%`),
          ilike(candidates.currentCompany, `%${params.search}%`),
        ),
      );
    }

    if (params?.inTalentPool !== undefined) {
      conditions.push(eq(candidates.inTalentPool, params.inTalentPool));
    }

    const candidateList = await db
      .select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: candidates.email,
        phone: candidates.phone,
        city: candidates.city,
        country: candidates.country,
        currentDesignation: candidates.currentDesignation,
        currentCompany: candidates.currentCompany,
        totalExperienceYears: candidates.totalExperienceYears,
        totalExperienceText: candidates.totalExperienceText,
        expectedSalary: candidates.expectedSalary,
        expectedSalaryText: candidates.expectedSalaryText,
        noticePeriodDays: candidates.noticePeriodDays,
        noticePeriodText: candidates.noticePeriodText,
        rating: candidates.rating,
        skills: candidates.skills,
        resumeUrl: candidates.resumeUrl,
        resumeFileName: candidates.resumeFileName,
        portfolioUrl: candidates.portfolioUrl,
        linkedInUrl: candidates.linkedInUrl,
        coverLetter: candidates.coverLetter,
        notes: candidates.notes,
        inTalentPool: candidates.inTalentPool,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
      })
      .from(candidates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(candidates.createdAt));

    return candidateList;
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return [];
  }
}

export async function getCandidateById(id: string) {
  try {
    const cand = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!cand[0]) return null;

    // Fetch applications
    const apps = await db
      .select({
        id: jobApplications.id,
        stage: jobApplications.stage,
        fitScore: jobApplications.fitScore,
        source: jobApplications.source,
        createdAt: jobApplications.createdAt,
        jobId: jobOpenings.id,
        jobTitle: jobOpenings.title,
      })
      .from(jobApplications)
      .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
      .where(eq(jobApplications.candidateId, id));

    // Fetch scheduled interviews
    const candInterviews = await db
      .select({
        id: interviews.id,
        roundTitle: interviews.roundTitle,
        roundType: interviews.roundType,
        scheduledStart: interviews.scheduledStart,
        durationMinutes: interviews.durationMinutes,
        status: interviews.status,
        meetingLink: interviews.meetingLink,
      })
      .from(interviews)
      .where(eq(interviews.candidateId, id))
      .orderBy(desc(interviews.scheduledStart));

    // Fetch offers
    const candOffers = await db
      .select()
      .from(offers)
      .where(eq(offers.candidateId, id));

    return {
      ...cand[0],
      applications: apps,
      interviews: candInterviews,
      offers: candOffers,
    };
  } catch (error) {
    console.error(`Failed to get candidate ${id}:`, error);
    return null;
  }
}

export async function createCandidate(data: {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  currentDesignation?: string;
  currentCompany?: string;
  totalExperienceYears?: number;
  totalExperienceText?: string;
  expectedSalary?: number;
  expectedSalaryText?: string;
  noticePeriodDays?: number;
  noticePeriodText?: string;
  skills?: string[];
  resumeUrl?: string;
  resumeFileName?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  coverLetter?: string;
  notes?: string;
  inTalentPool?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canManageCandidates", user.permissions);

  const newId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(candidates).values({
    id: newId,
    orgId: "org_myorganisation",
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    city: data.city || "San Francisco",
    country: data.country || "United States",
    currentDesignation: data.currentDesignation || "Software Engineer",
    currentCompany: data.currentCompany || "Technology Corp",
    totalExperienceYears: data.totalExperienceYears || 4,
    totalExperienceText: data.totalExperienceText || `${data.totalExperienceYears || 4} Years`,
    expectedSalary: data.expectedSalary || 140000,
    expectedSalaryText: data.expectedSalaryText || (data.expectedSalary ? `$${data.expectedSalary.toLocaleString()}` : "$140,000 / year"),
    noticePeriodDays: data.noticePeriodDays || 30,
    noticePeriodText: data.noticePeriodText || `${data.noticePeriodDays || 30} Days`,
    rating: "4.8",
    skills: data.skills || ["React", "TypeScript", "Node.js"],
    resumeUrl: data.resumeUrl || null,
    resumeFileName: data.resumeFileName || null,
    portfolioUrl: data.portfolioUrl || null,
    linkedInUrl: data.linkedInUrl || null,
    coverLetter: data.coverLetter || null,
    notes: data.notes || "Sourced candidate profile.",
    inTalentPool: data.inTalentPool ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/candidates");
  revalidatePath("/dashboard");

  return { success: true, id: newId };
}

export async function updateCandidate(
  id: string,
  data: Partial<{
    fullName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    currentDesignation: string;
    currentCompany: string;
    totalExperienceYears: number;
    totalExperienceText: string;
    expectedSalary: number;
    expectedSalaryText: string;
    noticePeriodDays: number;
    noticePeriodText: string;
    rating: string;
    skills: string[];
    resumeUrl: string;
    resumeFileName: string;
    portfolioUrl: string;
    linkedInUrl: string;
    coverLetter: string;
    notes: string;
    inTalentPool: boolean;
  }>,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canManageCandidates", user.permissions);

  await db
    .update(candidates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(candidates.id, id));

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleTalentPool(id: string, inTalentPool: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canManageCandidates", user.permissions);

  await db
    .update(candidates)
    .set({
      inTalentPool,
      updatedAt: new Date(),
    })
    .where(eq(candidates.id, id));

  revalidatePath("/candidates");
  return { success: true, inTalentPool };
}

export async function deleteCandidate(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canManageCandidates", user.permissions);

  await db.delete(candidates).where(eq(candidates.id, id));

  revalidatePath("/candidates");
  revalidatePath("/applications");
  revalidatePath("/dashboard");

  return { success: true };
}
