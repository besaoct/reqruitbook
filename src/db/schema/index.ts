import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* ENUMS                                                                      */
/* -------------------------------------------------------------------------- */

export const roleEnum = pgEnum("user_role", [
  "system_admin",
  "hr_admin",
  "recruiter",
  "hiring_manager",
  "interviewer",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "published",
  "on_hold",
  "closed",
]);

export const workModeEnum = pgEnum("work_mode", [
  "on_site",
  "remote",
  "hybrid",
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
]);

export const applicationStageEnum = pgEnum("application_stage", [
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "evaluation",
  "selected",
  "offer",
  "hired",
  "rejected",
]);

export const interviewStatusEnum = pgEnum("interview_status", [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "accepted",
  "declined",
  "expired",
]);

/* -------------------------------------------------------------------------- */
/* TABLES                                                                     */
/* -------------------------------------------------------------------------- */

// 1. Organization & Settings
export const organizations = pgTable("organizations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull().default("My Organisation"),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  careersDomain: text("careers_domain").default("careers.myorganisation.com"),
  logoUrl: text("logo_url").default("/logo.png"),
  defaultCurrency: varchar("default_currency", { length: 8 }).default("USD"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  hrmWebhookUrl: text("hrm_webhook_url"),
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Departments
export const departments = pgTable("departments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  leadName: text("lead_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Locations
export const locations = pgTable("locations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  isRemoteHub: boolean("is_remote_hub").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3b. Dynamic Work Modes
export const workModes = pgTable("work_modes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Hybrid", "Remote", "On-Site"
  slug: varchar("slug", { length: 64 }).notNull(), // e.g. "hybrid", "remote", "on_site"
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3c. Dynamic Employment Types
export const employmentTypes = pgTable("employment_types", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Full-time", "Part-time", "Contract", "Internship"
  slug: varchar("slug", { length: 64 }).notNull(), // e.g. "full_time", "part_time", "contract", "internship"
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3d. Dynamic Experience Levels
export const experienceLevels = pgTable("experience_levels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Senior Level (5-8 yrs)"
  slug: varchar("slug", { length: 64 }).notNull(), // e.g. "senior"
  minYears: integer("min_years").default(0),
  maxYears: integer("max_years").default(0),
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3e. Dynamic Education Requirements
export const educationLevels = pgTable("education_levels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Bachelor's Degree or Equivalent"
  slug: varchar("slug", { length: 64 }).notNull(), // e.g. "bachelors"
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4a. Dynamic Roles & RBAC
export const roles = pgTable(
  "roles",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    orgId: varchar("org_id", { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    description: text("description"),
    badge: varchar("badge", { length: 32 }).default("Custom"),
    permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("roles_org_slug_idx").on(table.orgId, table.slug),
  ],
);

// 4b. Users & RBAC
export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 64 }).notNull().default("recruiter"),
  departmentId: varchar("department_id", { length: 64 }).references(
    () => departments.id,
    { onDelete: "set null" },
  ),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4c. Active Auth Sessions (Token Hashed for Security)
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
  ],
);

// 5. Job Openings / Requisitions
export const jobOpenings = pgTable(
  "job_openings",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    orgId: varchar("org_id", { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    departmentId: varchar("department_id", { length: 64 }).references(
      () => departments.id,
      { onDelete: "set null" },
    ),
    locationId: varchar("location_id", { length: 64 }).references(
      () => locations.id,
      { onDelete: "set null" },
    ),
    locationText: text("location_text").default("San Francisco, CA / Remote"),
    workMode: varchar("work_mode", { length: 64 }).default("hybrid").notNull(),
    employmentType: varchar("employment_type", { length: 64 })
      .default("full_time")
      .notNull(),
    vacancies: integer("vacancies").default(1).notNull(),
    hiringManagerId: varchar("hiring_manager_id", { length: 64 }).references(
      () => users.id,
      { onDelete: "set null" },
    ),
    recruiterId: varchar("recruiter_id", { length: 64 }).references(
      () => users.id,
      { onDelete: "set null" },
    ),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: varchar("currency", { length: 8 }).default("USD"),
    payFrequency: varchar("pay_frequency", { length: 32 }).default("annual"),
    isSalaryPublic: boolean("is_salary_public").default(true).notNull(),
    equityRange: text("equity_range"),
    bonusStructure: text("bonus_structure"),
    relocationAssistance: text("relocation_assistance"),
    reqCode: varchar("req_code", { length: 64 }),
    experienceLevel: varchar("experience_level", { length: 64 }).default("mid"),
    educationLevel: varchar("education_level", { length: 64 }).default("bachelors"),
    targetStartDate: timestamp("target_start_date"),
    status: jobStatusEnum("status").default("draft").notNull(),
    summary: text("summary"),
    responsibilities: text("responsibilities"),
    requirements: text("requirements"),
    niceToHave: text("nice_to_have"),
    aboutTeam: text("about_team"),
    benefits: text("benefits"),
    benefitsList: jsonb("benefits_list")
      .$type<
        {
          id?: string;
          title: string;
          description?: string;
          category?: string;
        }[]
      >()
      .default([]),
    skills: jsonb("skills").$type<string[]>().default([]),
    secondarySkills: jsonb("secondary_skills").$type<string[]>().default([]),
    customQuestions: jsonb("custom_questions").$type<any[]>().default([]),
    publishedAt: timestamp("published_at"),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("job_status_idx").on(table.status),
    deptIdx: index("job_dept_idx").on(table.departmentId),
  }),
);

// 6. Candidates Directory & Talent Pool
export const candidates = pgTable(
  "candidates",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    orgId: varchar("org_id", { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    city: text("city"),
    country: text("country"),
    currentDesignation: text("current_designation"),
    currentCompany: text("current_company"),
    totalExperienceYears: integer("total_experience_years"),
    totalExperienceText: text("total_experience_text"),
    expectedSalary: integer("expected_salary"),
    expectedSalaryText: text("expected_salary_text"),
    noticePeriodDays: integer("notice_period_days"),
    noticePeriodText: text("notice_period_text"),
    rating: text("rating").default("4.8"),
    skills: jsonb("skills").$type<string[]>().default([]),
    resumeUrl: text("resume_url"),
    resumeFileName: text("resume_file_name"),
    portfolioUrl: text("portfolio_url"),
    linkedInUrl: text("linkedin_url"),
    coverLetter: text("cover_letter"),
    notes: text("notes"),
    inTalentPool: boolean("in_talent_pool").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailOrgIdx: uniqueIndex("candidate_email_org_idx").on(
      table.orgId,
      table.email,
    ),
  }),
);

// 7. Job Applications (Kanban Pipeline)
export const jobApplications = pgTable(
  "job_applications",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    jobId: varchar("job_id", { length: 64 })
      .notNull()
      .references(() => jobOpenings.id, { onDelete: "cascade" }),
    candidateId: varchar("candidate_id", { length: 64 })
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    stage: applicationStageEnum("stage").default("applied").notNull(),
    fitScore: integer("fit_score").default(85),
    source: text("source").default("Careers Portal (Direct)"),
    answers: jsonb("answers").$type<Record<string, any>>().default({}),
    rejectedReason: text("rejected_reason"),
    hiredAt: timestamp("hired_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    jobCandidateIdx: uniqueIndex("app_job_candidate_idx").on(
      table.jobId,
      table.candidateId,
    ),
    stageIdx: index("app_stage_idx").on(table.stage),
  }),
);

// 8. Interviews & Panels
export const interviews = pgTable("interviews", {
  id: varchar("id", { length: 64 }).primaryKey(),
  applicationId: varchar("application_id", { length: 64 })
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id", { length: 64 })
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  roundTitle: text("round_title").notNull(),
  roundType: varchar("round_type", { length: 32 }).default("technical"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  format: varchar("format", { length: 32 }).default("video"),
  meetingLink: text("meeting_link"),
  panelMemberIds: jsonb("panel_member_ids").$type<string[]>().default([]),
  status: interviewStatusEnum("status").default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Scorecards & Evaluation Feedback
export const interviewScorecards = pgTable("interview_scorecards", {
  id: varchar("id", { length: 64 }).primaryKey(),
  interviewId: varchar("interview_id", { length: 64 })
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  interviewerId: varchar("interviewer_id", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  overallRating: integer("overall_rating").notNull(), // 1 to 5
  recommendation: varchar("recommendation", { length: 32 }).notNull(), // strong_hire, hire, no_hire, strong_no_hire
  technicalScore: integer("technical_score"),
  communicationScore: integer("communication_score"),
  cultureScore: integer("culture_score"),
  strengths: text("strengths"),
  concerns: text("concerns"),
  feedbackNotes: text("feedback_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// 10. Offer Management & HRM Sync
export const offers = pgTable("offers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  applicationId: varchar("application_id", { length: 64 })
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id", { length: 64 })
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  designation: text("designation").notNull(),
  departmentName: text("department_name").notNull(),
  baseSalary: integer("base_salary").notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  joiningDate: text("joining_date").notNull(),
  reportingManager: text("reporting_manager"),
  workLocation: text("work_location"),
  benefitsSummary: text("benefits_summary"),
  offerLetterContent: text("offer_letter_content"),
  status: offerStatusEnum("status").default("draft").notNull(),
  hrmSynced: boolean("hrm_synced").default(false).notNull(),
  hrmSyncedAt: timestamp("hrm_synced_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 11. Communication Templates & Message History
export const communicationTemplates = pgTable("communication_templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  triggerEvent: varchar("trigger_event", { length: 64 }).notNull(),
  subject: text("subject").notNull(),
  bodyTemplate: text("body_template").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidateMessages = pgTable("candidate_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  candidateId: varchar("candidate_id", { length: 64 })
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  templateId: varchar("template_id", { length: 64 }).references(
    () => communicationTemplates.id,
    { onDelete: "set null" },
  ),
  senderId: varchar("sender_id", { length: 64 }).references(() => users.id, {
    onDelete: "set null",
  }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 32 }).default("sent").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// 12. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id", { length: 64 }).references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/* RELATIONS                                                                  */
/* -------------------------------------------------------------------------- */

export const organizationRelations = relations(organizations, ({ many }) => ({
  departments: many(departments),
  locations: many(locations),
  users: many(users),
  jobs: many(jobOpenings),
  candidates: many(candidates),
}));

export const departmentRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [departments.orgId],
    references: [organizations.id],
  }),
  jobs: many(jobOpenings),
  users: many(users),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  managedJobs: many(jobOpenings, { relationName: "hiringManager" }),
  recruitedJobs: many(jobOpenings, { relationName: "recruiter" }),
  sessions: many(sessions),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const jobOpeningRelations = relations(jobOpenings, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [jobOpenings.orgId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [jobOpenings.departmentId],
    references: [departments.id],
  }),
  location: one(locations, {
    fields: [jobOpenings.locationId],
    references: [locations.id],
  }),
  hiringManager: one(users, {
    fields: [jobOpenings.hiringManagerId],
    references: [users.id],
    relationName: "hiringManager",
  }),
  recruiter: one(users, {
    fields: [jobOpenings.recruiterId],
    references: [users.id],
    relationName: "recruiter",
  }),
  applications: many(jobApplications),
}));

export const candidateRelations = relations(candidates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [candidates.orgId],
    references: [organizations.id],
  }),
  applications: many(jobApplications),
  interviews: many(interviews),
  offers: many(offers),
  messages: many(candidateMessages),
}));

export const jobApplicationRelations = relations(
  jobApplications,
  ({ one, many }) => ({
    job: one(jobOpenings, {
      fields: [jobApplications.jobId],
      references: [jobOpenings.id],
    }),
    candidate: one(candidates, {
      fields: [jobApplications.candidateId],
      references: [candidates.id],
    }),
    interviews: many(interviews),
    offers: many(offers),
  }),
);

export const interviewRelations = relations(interviews, ({ one, many }) => ({
  application: one(jobApplications, {
    fields: [interviews.applicationId],
    references: [jobApplications.id],
  }),
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  scorecards: many(interviewScorecards),
}));

export const offerRelations = relations(offers, ({ one }) => ({
  application: one(jobApplications, {
    fields: [offers.applicationId],
    references: [jobApplications.id],
  }),
  candidate: one(candidates, {
    fields: [offers.candidateId],
    references: [candidates.id],
  }),
}));
