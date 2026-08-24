"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  LogOut,
  Menu,
  Search,
  Settings,
  Building2,
  User,
  Bell,
  Globe,
  Plus,
} from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { NotificationPopover } from "@/components/layout/notification-popover";
import type { NavNodeView } from "@/lib/navigation";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RoleGuard } from "@/components/auth/role-guard";
import { RoutePermissionGuard } from "@/components/auth/route-permission-guard";
import { useAuth } from "@/components/auth/auth-context";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ShellDepartment {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
}

export interface AppShellProps {
  organizationName: string;
  navigation: NavNodeView[];
  user: ShellUser;
  departments: ShellDepartment[];
  activeDepartmentId: string | null;
  unreadCount: number;
  children: React.ReactNode;
}

export function AppShell({
  organizationName,
  navigation,
  user,
  departments,
  activeDepartmentId,
  unreadCount,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Collapse automatically on narrow screens
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1180px)");
    const apply = (matches: boolean) => setCollapsed(matches);
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const activeDepartment =
    departments.find((d) => d.id === activeDepartmentId) ?? departments[0] ?? null;

  const sidebar = (
    <Rail
      organizationName={organizationName}
      navigation={navigation}
      collapsed={collapsed}
    />
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sticky rail */}
      <div className="sticky top-0 z-20 hidden h-screen shrink-0 self-start md:flex">
        {sidebar}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-2.5 top-13 z-20 flex size-5 items-center justify-center rounded-full border border-shell-border bg-shell text-shell-foreground transition-all hover:border-copper hover:text-copper shadow-xs cursor-pointer"
        >
          <ChevronLeft
            className={cn("size-3 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-62 border-r-0 p-0">
          <SheetTitle className="sr-only">ReqruitBook Navigation</SheetTitle>
          <Rail
            organizationName={organizationName}
            navigation={navigation}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>

      {/* Main content viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          user={user}
          departments={departments}
          activeDepartment={activeDepartment}
          unreadCount={unreadCount}
        />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6 md:py-6">
            <RoutePermissionGuard>{children}</RoutePermissionGuard>
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}

function Rail({
  organizationName,
  navigation,
  collapsed,
}: {
  organizationName: string;
  navigation: NavNodeView[];
  collapsed: boolean;
}) {
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-shell-border bg-shell text-shell-foreground transition-[width] duration-200",
        collapsed ? "w-15" : "w-62",
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-shell-border px-3">
        <Image
          src="/logo.png"
          alt="ReqruitBook Logo"
          width={32}
          height={32}
          className="size-8 rounded-xs object-contain"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight flex items-center gap-1.5">
              <span>ReqruitBook</span>
            </div>
            <div className="truncate text-[11px] leading-tight text-shell-muted">
              {organizationName}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tree */}
      <SidebarNav items={navigation} collapsed={collapsed} />
    </aside>
  );
}

function Header({
  onOpenMobile,
  onOpenSearch,
  user,
  departments,
  activeDepartment,
  unreadCount,
}: {
  onOpenMobile: () => void;
  onOpenSearch: () => void;
  user: ShellUser;
  departments: ShellDepartment[];
  activeDepartment: ShellDepartment | null;
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/95 backdrop-blur px-3 md:px-5">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onOpenMobile}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      {/* Search Bar / Command Palette Trigger */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden max-w-sm flex-1 md:flex items-center justify-between gap-2 h-8 w-full rounded-xs border border-input bg-background pl-2.5 pr-2 text-xs text-muted-foreground transition-colors hover:border-ring focus:border-ring text-left"
      >
        <div className="flex items-center gap-2">
          <Search className="size-3.5 text-muted-foreground" />
          <span>Search candidates, jobs, pipeline...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-xs border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      {/* Department / Org Switcher */}
      {departments.length > 0 ? (
        <DepartmentSwitcher
          departments={departments}
          active={activeDepartment}
        />
      ) : null}

      {/* Quick Action Button */}
      <RoleGuard permission="canCreateJobs">
        <Link href="/jobs/new" className="hidden sm:block">
          <Button size="xs" variant="accent" className="gap-1 text-xs">
            <Plus className="size-3.5" />
            <span>New Opening</span>
          </Button>
        </Link>
      </RoleGuard>

      {/* Careers Portal Link */}
      <Link
        href="/careers"
        target="_blank"
        className="hidden sm:flex items-center gap-1 h-7 px-2 rounded-xs border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="View public careers portal"
      >
        <Globe className="size-3.5 text-copper" />
        <span>Careers Portal</span>
      </Link>

      {/* Notifications Dialog & Activity Popover */}
      <NotificationPopover initialUnreadCount={unreadCount} />

      {/* User Avatar Menu */}
      <UserMenu user={user} />
    </header>
  );
}

function DepartmentSwitcher({
  departments,
  active,
}: {
  departments: ShellDepartment[];
  active: ShellDepartment | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Building2 className="size-3.5 text-muted-foreground" />
          <span className="max-w-32 truncate">
            {active?.name ?? "All Departments"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          Filter by Department
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {departments.map((dept) => (
          <DropdownMenuItem key={dept.id} asChild>
            <div
              className={cn(
                "flex w-full items-center justify-between gap-2 text-xs py-1.5 cursor-pointer",
                dept.id === active?.id && "font-semibold text-copper",
              )}
            >
              <span className="truncate">{dept.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {dept.code}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  const { isSuperAdmin, hasPermission } = useAuth();
  const canViewSettings = isSuperAdmin || hasPermission("canManageSettings");
  const canViewRBAC = isSuperAdmin || hasPermission("canAssignRoles");
  const canViewUsers = isSuperAdmin || hasPermission("canManageUsers");
  const canViewDepts = isSuperAdmin || hasPermission("canManageDepartments");
  const hasAnySettingsAccess = canViewSettings || canViewRBAC || canViewUsers || canViewDepts;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xs px-1.5 py-1 transition-colors hover:bg-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-bark text-[11px] font-semibold text-parchment">
            {initials(user.name)}
          </span>
          <span className="hidden text-left leading-tight lg:block">
            <span className="block max-w-35 truncate text-xs font-medium">
              {user.name}
            </span>
            <span className="block max-w-35 truncate text-[10px] text-muted-foreground">
              {user.roleLabel}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-medium">{user.name}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Dynamically Filtered Settings Options */}
        {canViewSettings && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="gap-2 text-xs cursor-pointer">
                <User className="size-3.5" />
                <span>Organization &amp; Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=integrations" className="gap-2 text-xs cursor-pointer">
                <Settings className="size-3.5" />
                <span>HRM &amp; Microfrontend Settings</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {!canViewSettings && canViewRBAC && (
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=rbac" className="gap-2 text-xs cursor-pointer">
              <Settings className="size-3.5" />
              <span>Roles &amp; Permissions (RBAC)</span>
            </Link>
          </DropdownMenuItem>
        )}

        {!canViewSettings && canViewUsers && (
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=users" className="gap-2 text-xs cursor-pointer">
              <User className="size-3.5" />
              <span>User Directory</span>
            </Link>
          </DropdownMenuItem>
        )}

        {!canViewSettings && canViewDepts && (
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=departments" className="gap-2 text-xs cursor-pointer">
              <Settings className="size-3.5" />
              <span>Departments</span>
            </Link>
          </DropdownMenuItem>
        )}

        {hasAnySettingsAccess && <DropdownMenuSeparator />}

        <DropdownMenuItem asChild>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 text-destructive text-xs cursor-pointer focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
