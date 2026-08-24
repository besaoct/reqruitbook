import { AppShell } from "@/components/layout/app-shell";
import { getNavigation } from "@/lib/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthProvider } from "@/components/auth/auth-context";
import { getNavigationBadgeCounts } from "@/lib/actions/navigation";
import { getDepartments } from "@/lib/actions/settings";

const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Administrator",
  hr_admin: "HR Administrator",
  recruiter: "Lead Talent Partner",
  hiring_manager: "Hiring Manager",
  interviewer: "Interview Panelist",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, badges, dbDepts] = await Promise.all([
    getCurrentUser(),
    getNavigationBadgeCounts(),
    getDepartments(),
  ]);

  const departments = [
    { id: "dept_all", name: "All Departments", code: "ALL", location: "Global" },
    ...dbDepts.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      location: d.leadName || "Office",
    })),
  ];

  const userRole = currentUser?.role || "recruiter";
  const userPermissions = currentUser?.permissions || [];

  const user = {
    id: currentUser?.id || "usr_recruiter_01",
    name: currentUser?.name || "Recruiter",
    email: currentUser?.email || "recruiter@myorganisation.com",
    roleLabel: ROLE_LABELS[userRole] || userRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };

  // Pass dynamic role and permissions to filter navigation
  const navigation = getNavigation(badges, userRole, userPermissions);

  const totalUnreadNotifs =
    (badges.pendingFeedback || 0) +
    (badges.screeningCount || 0) +
    (badges.interviewsToday || 0) +
    (badges.pendingOffers || 0);

  return (
    <AuthProvider user={currentUser}>
      <AppShell
        organizationName={currentUser?.organizationName || "My Organisation"}
        navigation={navigation}
        user={user}
        departments={departments}
        activeDepartmentId="dept_all"
        unreadCount={totalUnreadNotifs}
      >
        {children}
      </AppShell>
    </AuthProvider>
  );
}
