import type { Permission } from "./auth/rbac";

export interface ModuleDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  defaultEnabled?: boolean;
}

export interface NavChildDef {
  label: string;
  href: string;
  icon?: string;
  badgeKey?: string;
  permission?: Permission | string;
  permissions?: (Permission | string)[];
  feature?: string;
}

export interface NavDef {
  label: string;
  href: string;
  icon: string;
  moduleSlug: string;
  badgeKey?: string;
  permission?: Permission | string;
  permissions?: (Permission | string)[];
  feature?: string;
  children?: NavChildDef[];
}

export const RECRUITMENT_MODULES: ModuleDef[] = [
  {
    slug: "dashboard",
    name: "Dashboard",
    description: "Recruitment overview, KPI tiles, pipeline analytics",
    icon: "LayoutDashboard",
    defaultEnabled: true,
  },
  {
    slug: "jobs",
    name: "Job Management",
    description: "Requisitions, job descriptions, openings, approval workflow",
    icon: "Briefcase",
    defaultEnabled: true,
  },
  {
    slug: "applications",
    name: "Applications & Pipeline",
    description: "Applicant tracking, screening, kanban stages, stage progression",
    icon: "Layers",
    defaultEnabled: true,
  },
  {
    slug: "candidates",
    name: "Candidates & Talent Pool",
    description: "Talent repository, resumes, cross-job profiles, skill tags",
    icon: "Users",
    defaultEnabled: true,
  },
  {
    slug: "interviews",
    name: "Interview Management",
    description: "Calendar scheduling, interview rounds, evaluation scorecards",
    icon: "CalendarDays",
    defaultEnabled: true,
  },
  {
    slug: "offers",
    name: "Offer Management",
    description: "Offer letters, compensation packages, approvals, acceptance",
    icon: "FileText",
    defaultEnabled: true,
  },
  {
    slug: "communications",
    name: "Communications",
    description: "Automated candidate emails, messaging templates, history",
    icon: "Mail",
    defaultEnabled: true,
  },
  {
    slug: "reports",
    name: "Reports & Analytics",
    description: "Time to hire, recruitment source funnel, recruiter metrics",
    icon: "ChartColumn",
    defaultEnabled: true,
  },
  {
    slug: "careers",
    name: "Careers Portal",
    description: "Public job board, application form, candidate account tracking",
    icon: "Globe",
    defaultEnabled: true,
  },
  {
    slug: "settings",
    name: "Settings",
    description: "Company, roles, pipeline stages, HRM integration, webhooks",
    icon: "Settings",
    defaultEnabled: true,
  },
];

export const MODULE_BY_SLUG = Object.fromEntries(
  RECRUITMENT_MODULES.map((m) => [m.slug, m]),
);

export const APP_NAVIGATION: NavDef[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    moduleSlug: "dashboard",
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: "Briefcase",
    moduleSlug: "jobs",
    permissions: ["canCreateJobs", "canEditJobs", "canDeleteJobs"],
    children: [
      { label: "All Openings", href: "/jobs" },
      { label: "Open Jobs", href: "/jobs?status=open", badgeKey: "openJobs" },
      { label: "Drafts", href: "/jobs?status=draft" },
      { label: "On Hold", href: "/jobs?status=on_hold" },
      { label: "Closed", href: "/jobs?status=closed" },
      { label: "+ Create Job", href: "/jobs/new", permission: "canCreateJobs" },
    ],
  },
  {
    label: "Applications",
    href: "/applications",
    icon: "Layers",
    moduleSlug: "applications",
    badgeKey: "activeApplications",
    permissions: ["canAdvancePipeline", "canManageCandidates"],
    children: [
      { label: "All Applications", href: "/applications" },
      { label: "New / Screening", href: "/applications?stage=screening", badgeKey: "screeningCount" },
      { label: "Shortlisted", href: "/applications?stage=shortlisted" },
      { label: "Interview Round", href: "/applications?stage=interview" },
      { label: "Selected", href: "/applications?stage=selected" },
      { label: "Offer Stage", href: "/applications?stage=offer" },
      { label: "Hired (HRM)", href: "/applications?stage=hired" },
      { label: "Rejected", href: "/applications?stage=rejected" },
    ],
  },
  {
    label: "Candidates",
    href: "/candidates",
    icon: "Users",
    moduleSlug: "candidates",
    permissions: ["canManageCandidates"],
    children: [
      { label: "All Candidates", href: "/candidates" },
      { label: "Talent Pool", href: "/candidates?tab=talent-pool" },
      { label: "+ Add Candidate", href: "/candidates/new", permission: "canManageCandidates" },
    ],
  },
  {
    label: "Interviews",
    href: "/interviews",
    icon: "CalendarDays",
    moduleSlug: "interviews",
    badgeKey: "interviewsToday",
    permissions: ["canScheduleInterviews", "canSubmitScorecard", "canViewScorecards"],
    children: [
      { label: "Calendar View", href: "/interviews" },
      { label: "Upcoming Rounds", href: "/interviews?view=upcoming" },
      { label: "Completed", href: "/interviews?view=completed" },
      { label: "Pending Feedback", href: "/interviews?view=feedback", badgeKey: "pendingFeedback" },
      { label: "+ Schedule Round", href: "/interviews/schedule", permission: "canScheduleInterviews" },
    ],
  },
  {
    label: "Offers",
    href: "/offers",
    icon: "FileCheck",
    moduleSlug: "offers",
    permissions: ["canCreateOffers", "canApproveOffers", "canViewSalaries", "canSyncHRM"],
    children: [
      { label: "All Offers", href: "/offers" },
      { label: "Draft Offers", href: "/offers?status=draft" },
      { label: "Pending Approval", href: "/offers?status=pending_approval" },
      { label: "Sent / Out", href: "/offers?status=sent" },
      { label: "Accepted", href: "/offers?status=accepted" },
      { label: "Rejected / Expired", href: "/offers?status=declined" },
      { label: "+ Create Offer", href: "/offers/new", permission: "canCreateOffers" },
    ],
  },
  {
    label: "Communications",
    href: "/communications",
    icon: "Mail",
    moduleSlug: "communications",
    permissions: ["canSendCommunications"],
    children: [
      { label: "Email Templates", href: "/communications" },
      { label: "Delivery Audit History", href: "/communications?tab=history" },
    ],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "ChartColumn",
    moduleSlug: "reports",
    permissions: ["canViewReports"],
    children: [
      { label: "Recruitment Overview", href: "/reports" },
      { label: "Time-to-Hire & Fill", href: "/reports?tab=time-to-hire" },
      { label: "Source Performance", href: "/reports?tab=sources" },
      { label: "Interviewer Analytics", href: "/reports?tab=interviewers" },
    ],
  },
  {
    label: "Careers Portal",
    href: "/careers",
    icon: "Globe",
    moduleSlug: "careers",
    children: [
      { label: "Public Job Board", href: "/careers" },
      { label: "Candidate Portal", href: "/careers/portal" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    moduleSlug: "settings",
    permissions: [
      "canManageSettings",
      "canManageUsers",
      "canAssignRoles",
      "canManageDepartments",
      "canManageLocations",
      "canManageWorkModes",
      "canManageEmploymentTypes",
      "canManageExperienceLevels",
      "canManageEducationLevels",
    ],
    children: [
      { label: "Organization & Profile", href: "/settings?tab=profile", permission: "canManageSettings" },
      { label: "Currencies", href: "/settings?tab=currencies", permission: "canManageSettings" },
      { label: "Pay Frequencies", href: "/settings?tab=pay-frequencies", permission: "canManageSettings" },
      { label: "Requisition Statuses", href: "/settings?tab=job-statuses", permission: "canManageSettings" },
      { label: "Interview Rounds", href: "/settings?tab=interview-types", permission: "canManageSettings" },
      { label: "Benefit Categories", href: "/settings?tab=benefit-categories", permission: "canManageSettings" },
      { label: "Departments", href: "/settings?tab=departments", permission: "canManageDepartments" },
      { label: "Locations", href: "/settings?tab=locations", permission: "canManageLocations" },
      { label: "Work Modes", href: "/settings?tab=work-modes", permission: "canManageWorkModes" },
      { label: "Employment Types", href: "/settings?tab=employment-types", permission: "canManageEmploymentTypes" },
      { label: "Experience Levels", href: "/settings?tab=experience-levels", permission: "canManageExperienceLevels" },
      { label: "Education Levels", href: "/settings?tab=education-levels", permission: "canManageEducationLevels" },
      { label: "Users & Directory", href: "/settings?tab=users", permission: "canManageUsers" },
      { label: "Roles & Permissions (RBAC)", href: "/settings?tab=rbac", permission: "canAssignRoles" },
      { label: "SMTP & Email Delivery", href: "/settings?tab=smtp", permission: "canManageSettings" },
      { label: "HRM & Integrations", href: "/settings?tab=integrations", permission: "canManageSettings" },
      { label: "Security & Webhooks", href: "/settings?tab=security", permission: "canManageSettings" },
    ],
  },
];

export interface DynamicRouteRequirement {
  permissions: (Permission | string)[];
  mode: "any" | "all";
}

/**
 * Dynamically resolves required permissions for any given pathname by inspecting APP_NAVIGATION.
 * Zero hardcoding: automatically adapts as new navigation nodes, modules, or actions are added.
 */
export function getRoutePermissions(pathname: string): DynamicRouteRequirement | null {
  const cleanPath = pathname.split("?")[0];

  // 1. Check distinct sub-route match in navigation children (e.g. /candidates/new)
  for (const item of APP_NAVIGATION) {
    if (item.children) {
      for (const child of item.children) {
        const childPath = child.href.split("?")[0];
        const parentPath = item.href.split("?")[0];
        // Only evaluate child if it has a unique distinct pathname (not query-tab based)
        if (childPath === cleanPath && childPath !== parentPath) {
          if (child.permission) {
            return { permissions: [child.permission], mode: "all" };
          }
          if (child.permissions && child.permissions.length > 0) {
            return { permissions: child.permissions, mode: "any" };
          }
        }
      }
    }
  }

  // 2. Check top-level module match (exact or prefix)
  for (const item of APP_NAVIGATION) {
    const itemPath = item.href.split("?")[0];
    if (itemPath === cleanPath || cleanPath.startsWith(`${itemPath}/`)) {
      if (item.permission) {
        return { permissions: [item.permission], mode: "all" };
      }
      if (item.permissions && item.permissions.length > 0) {
        return { permissions: item.permissions, mode: "any" };
      }
    }
  }

  return null;
}
