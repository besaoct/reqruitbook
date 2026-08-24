"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { jobOpenings, departments, locations, users, jobApplications, organizations } from "@/db/schema";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/rbac";

export async function getJobs(params?: {
  status?: string;
  departmentId?: string;
  search?: string;
}) {
  try {
    const conditions = [];

    if (params?.status && params.status !== "all") {
      conditions.push(eq(jobOpenings.status, params.status as any));
    }
    if (params?.departmentId && params.departmentId !== "all") {
      conditions.push(eq(jobOpenings.departmentId, params.departmentId));
    }
    if (params?.search) {
      conditions.push(ilike(jobOpenings.title, `%${params.search}%`));
    }

    const query = db
      .select({
        id: jobOpenings.id,
        title: jobOpenings.title,
        status: jobOpenings.status,
        workMode: jobOpenings.workMode,
        employmentType: jobOpenings.employmentType,
        vacancies: jobOpenings.vacancies,
        locationText: jobOpenings.locationText,
        salaryMin: jobOpenings.salaryMin,
        salaryMax: jobOpenings.salaryMax,
        currency: jobOpenings.currency,
        summary: jobOpenings.summary,
        responsibilities: jobOpenings.responsibilities,
        requirements: jobOpenings.requirements,
        benefits: jobOpenings.benefits,
        skills: jobOpenings.skills,
        publishedAt: jobOpenings.publishedAt,
        createdAt: jobOpenings.createdAt,
        updatedAt: jobOpenings.updatedAt,
        departmentId: jobOpenings.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        locationId: jobOpenings.locationId,
        locationName: locations.name,
        locationCity: locations.city,
        locationCountry: locations.country,
        recruiterId: jobOpenings.recruiterId,
        recruiterName: users.name,
        applicantCount: sql<number>`count(${jobApplications.id})::int`,
      })
      .from(jobOpenings)
      .leftJoin(departments, eq(jobOpenings.departmentId, departments.id))
      .leftJoin(locations, eq(jobOpenings.locationId, locations.id))
      .leftJoin(users, eq(jobOpenings.recruiterId, users.id))
      .leftJoin(jobApplications, eq(jobOpenings.id, jobApplications.jobId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        jobOpenings.id,
        departments.name,
        departments.code,
        locations.name,
        locations.city,
        locations.country,
        users.name,
      )
      .orderBy(desc(jobOpenings.createdAt));

    return await query;
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return [];
  }
}

export async function getJobById(id: string) {
  try {
    const jobList = await db
      .select({
        id: jobOpenings.id,
        title: jobOpenings.title,
        reqCode: jobOpenings.reqCode,
        status: jobOpenings.status,
        workMode: jobOpenings.workMode,
        employmentType: jobOpenings.employmentType,
        experienceLevel: jobOpenings.experienceLevel,
        educationLevel: jobOpenings.educationLevel,
        vacancies: jobOpenings.vacancies,
        locationText: jobOpenings.locationText,
        salaryMin: jobOpenings.salaryMin,
        salaryMax: jobOpenings.salaryMax,
        currency: jobOpenings.currency,
        payFrequency: jobOpenings.payFrequency,
        isSalaryPublic: jobOpenings.isSalaryPublic,
        equityRange: jobOpenings.equityRange,
        bonusStructure: jobOpenings.bonusStructure,
        relocationAssistance: jobOpenings.relocationAssistance,
        targetStartDate: jobOpenings.targetStartDate,
        summary: jobOpenings.summary,
        responsibilities: jobOpenings.responsibilities,
        requirements: jobOpenings.requirements,
        niceToHave: jobOpenings.niceToHave,
        aboutTeam: jobOpenings.aboutTeam,
        benefits: jobOpenings.benefits,
        benefitsList: jobOpenings.benefitsList,
        skills: jobOpenings.skills,
        secondarySkills: jobOpenings.secondarySkills,
        customQuestions: jobOpenings.customQuestions,
        publishedAt: jobOpenings.publishedAt,
        createdAt: jobOpenings.createdAt,
        updatedAt: jobOpenings.updatedAt,
        departmentId: jobOpenings.departmentId,
        departmentName: departments.name,
        locationId: jobOpenings.locationId,
        locationName: locations.name,
        hiringManagerId: jobOpenings.hiringManagerId,
        recruiterId: jobOpenings.recruiterId,
        recruiterName: users.name,
      })
      .from(jobOpenings)
      .leftJoin(departments, eq(jobOpenings.departmentId, departments.id))
      .leftJoin(locations, eq(jobOpenings.locationId, locations.id))
      .leftJoin(users, eq(jobOpenings.recruiterId, users.id))
      .where(eq(jobOpenings.id, id))
      .limit(1);

    return jobList[0] || null;
  } catch (error) {
    console.error(`Failed to get job ${id}:`, error);
    return null;
  }
}

export async function createJob(data: {
  title: string;
  reqCode?: string;
  departmentId?: string;
  locationId?: string;
  locationText?: string;
  workMode?: string;
  employmentType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  vacancies?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  payFrequency?: string;
  isSalaryPublic?: boolean;
  equityRange?: string;
  bonusStructure?: string;
  relocationAssistance?: string;
  targetStartDate?: Date | null;
  summary?: string;
  responsibilities?: string;
  requirements?: string;
  niceToHave?: string;
  aboutTeam?: string;
  benefits?: string;
  benefitsList?: { id?: string; title: string; description?: string; category?: string }[];
  skills?: string[];
  secondarySkills?: string[];
  customQuestions?: any[];
  hiringManagerId?: string;
  recruiterId?: string;
  status?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canCreateJobs", user.permissions);

  const org = await db.select({ id: organizations.id }).from(organizations).limit(1);
  const orgId = org[0]?.id || "org_myorganisation";

  const newId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const status = data.status || "published";

  await db.insert(jobOpenings).values({
    id: newId,
    orgId,
    title: data.title,
    reqCode: data.reqCode || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    departmentId: data.departmentId || null,
    locationId: data.locationId || null,
    locationText: data.locationText || "San Francisco, CA / Remote",
    workMode: data.workMode || "hybrid",
    employmentType: data.employmentType || "full_time",
    experienceLevel: data.experienceLevel || "mid",
    educationLevel: data.educationLevel || "bachelors",
    vacancies: data.vacancies || 1,
    hiringManagerId: data.hiringManagerId || null,
    recruiterId: data.recruiterId || user.id,
    salaryMin: data.salaryMin || 100000,
    salaryMax: data.salaryMax || 150000,
    currency: data.currency || "USD",
    payFrequency: data.payFrequency || "annual",
    isSalaryPublic: data.isSalaryPublic ?? true,
    equityRange: data.equityRange || null,
    bonusStructure: data.bonusStructure || null,
    relocationAssistance: data.relocationAssistance || null,
    targetStartDate: data.targetStartDate || null,
    summary: data.summary || "",
    responsibilities: data.responsibilities || "",
    requirements: data.requirements || "",
    niceToHave: data.niceToHave || "",
    aboutTeam: data.aboutTeam || "",
    benefits: data.benefits || "",
    benefitsList: data.benefitsList || [],
    skills: data.skills || [],
    secondarySkills: data.secondarySkills || [],
    customQuestions: data.customQuestions || [],
    status,
    publishedAt: status === "published" ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/jobs");
  revalidatePath("/careers");
  revalidatePath("/dashboard");

  return { success: true, id: newId };
}

export async function updateJob(
  id: string,
  data: Partial<{
    title: string;
    reqCode: string;
    departmentId: string | null;
    locationId: string | null;
    locationText: string;
    workMode: string;
    employmentType: string;
    experienceLevel: string;
    educationLevel: string;
    vacancies: number;
    salaryMin: number;
    salaryMax: number;
    currency: string;
    payFrequency: string;
    isSalaryPublic: boolean;
    equityRange: string | null;
    bonusStructure: string | null;
    relocationAssistance: string | null;
    targetStartDate: Date | null;
    status: string;
    summary: string;
    responsibilities: string;
    requirements: string;
    niceToHave: string;
    aboutTeam: string;
    benefits: string;
    benefitsList: { id?: string; title: string; description?: string; category?: string }[];
    skills: string[];
    secondarySkills: string[];
    customQuestions: any[];
    hiringManagerId: string | null;
    recruiterId: string | null;
  }>,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canEditJobs", user.permissions);

  const updateValues: Record<string, any> = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.status === "published") {
    updateValues.publishedAt = new Date();
  } else if (data.status === "closed") {
    updateValues.closedAt = new Date();
  }

  await db.update(jobOpenings).set(updateValues).where(eq(jobOpenings.id, id));

  revalidatePath("/jobs");
  revalidatePath("/careers");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteJob(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canDeleteJobs", user.permissions);

  await db.delete(jobOpenings).where(eq(jobOpenings.id, id));

  revalidatePath("/jobs");
  revalidatePath("/careers");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function duplicateJob(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canCreateJobs", user.permissions);

  const original = await getJobById(id);
  if (!original) throw new Error("Job not found");

  const newId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(jobOpenings).values({
    id: newId,
    orgId: "org_myorganisation",
    title: `${original.title} (Copy)`,
    departmentId: original.departmentId,
    locationId: original.locationId,
    locationText: original.locationText,
    workMode: original.workMode as any,
    employmentType: original.employmentType as any,
    vacancies: original.vacancies,
    recruiterId: user.id,
    salaryMin: original.salaryMin,
    salaryMax: original.salaryMax,
    currency: original.currency,
    status: "draft",
    summary: original.summary,
    responsibilities: original.responsibilities,
    requirements: original.requirements,
    benefits: original.benefits,
    skills: original.skills,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/jobs");
  return { success: true, id: newId };
}
