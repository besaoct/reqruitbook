"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  jobApplications,
  candidates,
  jobOpenings,
  departments,
  interviews,
  interviewScorecards,
  offers,
  users,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/rbac";
import { recordAuditLog } from "@/lib/security/audit";

export type ApplicationStage =
  | "applied"
  | "screening"
  | "shortlisted"
  | "interview"
  | "evaluation"
  | "selected"
  | "offer"
  | "hired"
  | "rejected";

export async function getApplications(params?: {
  jobId?: string;
  stage?: string;
}) {
  try {
    const conditions = [];

    if (params?.jobId && params.jobId !== "all") {
      conditions.push(eq(jobApplications.jobId, params.jobId));
    }
    if (params?.stage && params.stage !== "all") {
      conditions.push(eq(jobApplications.stage, params.stage as any));
    }

    const apps = await db
      .select({
        id: jobApplications.id,
        stage: jobApplications.stage,
        fitScore: jobApplications.fitScore,
        source: jobApplications.source,
        answers: jobApplications.answers,
        rejectedReason: jobApplications.rejectedReason,
        hiredAt: jobApplications.hiredAt,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        jobId: jobOpenings.id,
        jobTitle: jobOpenings.title,
        reqCode: jobOpenings.reqCode,
        locationText: jobOpenings.locationText,
        workMode: jobOpenings.workMode,
        employmentType: jobOpenings.employmentType,
        customQuestions: jobOpenings.customQuestions,
        departmentName: departments.name,
        candidateId: candidates.id,
        candidateName: candidates.fullName,
        candidateEmail: candidates.email,
        candidatePhone: candidates.phone,
        candidateCity: candidates.city,
        candidateCountry: candidates.country,
        currentDesignation: candidates.currentDesignation,
        currentCompany: candidates.currentCompany,
        experienceYears: candidates.totalExperienceYears,
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
      })
      .from(jobApplications)
      .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
      .leftJoin(departments, eq(jobOpenings.departmentId, departments.id))
      .leftJoin(candidates, eq(jobApplications.candidateId, candidates.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobApplications.createdAt));

    return apps;
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return [];
  }
}

export async function getApplicationDetails(applicationId: string) {
  try {
    const apps = await db
      .select({
        id: jobApplications.id,
        stage: jobApplications.stage,
        fitScore: jobApplications.fitScore,
        source: jobApplications.source,
        answers: jobApplications.answers,
        rejectedReason: jobApplications.rejectedReason,
        hiredAt: jobApplications.hiredAt,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        jobId: jobOpenings.id,
        jobTitle: jobOpenings.title,
        reqCode: jobOpenings.reqCode,
        salaryMin: jobOpenings.salaryMin,
        salaryMax: jobOpenings.salaryMax,
        currency: jobOpenings.currency,
        payFrequency: jobOpenings.payFrequency,
        locationText: jobOpenings.locationText,
        workMode: jobOpenings.workMode,
        employmentType: jobOpenings.employmentType,
        experienceLevel: jobOpenings.experienceLevel,
        educationLevel: jobOpenings.educationLevel,
        summary: jobOpenings.summary,
        customQuestions: jobOpenings.customQuestions,
        departmentName: departments.name,
        candidateId: candidates.id,
        candidateName: candidates.fullName,
        candidateEmail: candidates.email,
        candidatePhone: candidates.phone,
        candidateCity: candidates.city,
        candidateCountry: candidates.country,
        currentDesignation: candidates.currentDesignation,
        currentCompany: candidates.currentCompany,
        experienceYears: candidates.totalExperienceYears,
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
      })
      .from(jobApplications)
      .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
      .leftJoin(departments, eq(jobOpenings.departmentId, departments.id))
      .leftJoin(candidates, eq(jobApplications.candidateId, candidates.id))
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    const app = apps[0];
    if (!app) return null;

    // Fetch interviews for this application
    const interviewList = await db
      .select({
        id: interviews.id,
        roundTitle: interviews.roundTitle,
        roundType: interviews.roundType,
        scheduledStart: interviews.scheduledStart,
        durationMinutes: interviews.durationMinutes,
        format: interviews.format,
        meetingLink: interviews.meetingLink,
        status: interviews.status,
        notes: interviews.notes,
        panelMemberIds: interviews.panelMemberIds,
      })
      .from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(desc(interviews.scheduledStart));

    // Fetch offer (if any)
    const offerList = await db
      .select()
      .from(offers)
      .where(eq(offers.applicationId, applicationId))
      .limit(1);

    return {
      ...app,
      interviews: interviewList,
      offer: offerList[0] || null,
    };
  } catch (error) {
    console.error("Failed to fetch application details:", error);
    return null;
  }
}

export async function updateApplicationStage(
  applicationId: string,
  newStage: ApplicationStage,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canAdvancePipeline", user.permissions);

  const updateData: Record<string, any> = {
    stage: newStage,
    updatedAt: new Date(),
  };

  if (newStage === "hired") {
    updateData.hiredAt = new Date();
  }

  await db
    .update(jobApplications)
    .set(updateData)
    .where(eq(jobApplications.id, applicationId));

  await recordAuditLog({
    actorId: user.id,
    action: "ats.stage_changed",
    entityType: "application",
    entityId: applicationId,
    metadata: { newStage, updatedBy: user.name, role: user.role },
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath("/candidates");

  return { success: true, newStage };
}

export async function rejectApplication(
  applicationId: string,
  rejectedReason: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canAdvancePipeline", user.permissions);

  await db
    .update(jobApplications)
    .set({
      stage: "rejected",
      rejectedReason,
      updatedAt: new Date(),
    })
    .where(eq(jobApplications.id, applicationId));

  await recordAuditLog({
    actorId: user.id,
    action: "ats.application_rejected",
    entityType: "application",
    entityId: applicationId,
    metadata: { rejectedReason, rejectedBy: user.name },
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function submitApplicationFromPortal(data: {
  jobId: string;
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
  answers?: Record<string, any>;
}) {
  // Check if candidate already exists by email
  const existingCandidate = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.email, data.email.toLowerCase().trim()))
    .limit(1);

  let candidateId = existingCandidate[0]?.id;

  if (!candidateId) {
    candidateId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(candidates).values({
      id: candidateId,
      orgId: "org_myorganisation",
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
      city: data.city || "San Francisco",
      country: data.country || "United States",
      currentDesignation: data.currentDesignation || "Applicant",
      currentCompany: data.currentCompany || null,
      totalExperienceYears: data.totalExperienceYears || 0,
      totalExperienceText: data.totalExperienceText || (data.totalExperienceYears ? `${data.totalExperienceYears} Years` : null),
      expectedSalary: data.expectedSalary || 0,
      expectedSalaryText: data.expectedSalaryText || (data.expectedSalary ? `$${data.expectedSalary.toLocaleString()}` : null),
      noticePeriodDays: data.noticePeriodDays || 30,
      noticePeriodText: data.noticePeriodText || (data.noticePeriodDays ? `${data.noticePeriodDays} Days` : null),
      rating: "4.8",
      skills: data.skills || ["Communication", "Problem Solving"],
      resumeUrl: data.resumeUrl || null,
      resumeFileName: data.resumeFileName || null,
      portfolioUrl: data.portfolioUrl || null,
      linkedInUrl: data.linkedInUrl || null,
      coverLetter: data.coverLetter || null,
      notes: data.coverLetter ? `Cover Letter: ${data.coverLetter}` : "Applied via Careers Portal.",
      inTalentPool: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Update existing candidate with latest contact and resume information
    await db
      .update(candidates)
      .set({
        fullName: data.fullName.trim(),
        phone: data.phone || undefined,
        city: data.city || undefined,
        currentDesignation: data.currentDesignation || undefined,
        currentCompany: data.currentCompany || undefined,
        totalExperienceYears: data.totalExperienceYears || undefined,
        totalExperienceText: data.totalExperienceText || undefined,
        expectedSalary: data.expectedSalary || undefined,
        expectedSalaryText: data.expectedSalaryText || undefined,
        noticePeriodDays: data.noticePeriodDays || undefined,
        noticePeriodText: data.noticePeriodText || undefined,
        skills: data.skills && data.skills.length > 0 ? data.skills : undefined,
        resumeUrl: data.resumeUrl || undefined,
        resumeFileName: data.resumeFileName || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        linkedInUrl: data.linkedInUrl || undefined,
        coverLetter: data.coverLetter || undefined,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId));
  }

  // Check if already applied to this job
  const existingApp = await db
    .select({ id: jobApplications.id })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.jobId, data.jobId),
        eq(jobApplications.candidateId, candidateId),
      ),
    )
    .limit(1);

  if (existingApp[0]) {
    return { success: true, message: "Application already received!", id: existingApp[0].id, candidateId };
  }

  const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(jobApplications).values({
    id: appId,
    jobId: data.jobId,
    candidateId,
    stage: "applied",
    fitScore: 92,
    source: "Careers Portal (Direct)",
    answers: data.answers || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await recordAuditLog({
    action: "ats.portal_application_received",
    entityType: "application",
    entityId: appId,
    metadata: {
      candidateName: data.fullName,
      candidateEmail: data.email,
      jobId: data.jobId,
      hasResume: !!data.resumeUrl,
    },
  });

  revalidatePath("/applications");
  revalidatePath("/candidates");
  revalidatePath("/dashboard");

  return { success: true, id: appId, candidateId };
}

