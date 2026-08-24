"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import {
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  ShieldCheck,
  MapPin,
  Lock,
  UserPlus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Coins,
  Clock,
  CalendarDays,
  Layers,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  getUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getWorkModes,
  createWorkMode,
  updateWorkMode,
  deleteWorkMode,
  getEmploymentTypes,
  createEmploymentType,
  updateEmploymentType,
  deleteEmploymentType,
  getExperienceLevels,
  createExperienceLevel,
  updateExperienceLevel,
  deleteExperienceLevel,
  getEducationLevels,
  createEducationLevel,
  updateEducationLevel,
  deleteEducationLevel,
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getPayFrequencies,
  createPayFrequency,
  updatePayFrequency,
  deletePayFrequency,
  getJobStatuses,
  createJobStatus,
  updateJobStatus,
  deleteJobStatus,
  getInterviewTypes,
  createInterviewType,
  updateInterviewType,
  deleteInterviewType,
  getBenefitCategories,
  createBenefitCategory,
  updateBenefitCategory,
  deleteBenefitCategory,
} from "@/lib/actions/settings";
import {
  TableShell,
  Table as DTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
  EmptyRow,
} from "@/components/shared/data-table";
import {
  getRoles,
  createRole,
  updateRole,
  toggleRolePermission,
  deleteRole,
  type RoleWithUsers,
} from "@/lib/actions/roles";
import {
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  type Permission,
} from "@/lib/auth/rbac";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAuth } from "@/components/auth/auth-context";
import { AccessDenied } from "@/components/auth/access-denied";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const { isSuperAdmin, canManageRBAC, hasPermission } = useAuth();

  const normalizeTab = (tab: string | null): string => {
    if (!tab || tab === "company") return "company";
    if (tab === "users" || tab === "roles") return "users";
    if (tab === "rbac" || tab === "permissions") return "rbac";
    if (tab === "departments") return "departments";
    if (tab === "locations") return "locations";
    if (tab === "currencies" || tab === "currency") return "currencies";
    if (tab === "pay-frequencies" || tab === "pay_frequencies" || tab === "pay-frequency") return "pay-frequencies";
    if (tab === "job-statuses" || tab === "job_statuses" || tab === "requisition-statuses") return "job-statuses";
    if (tab === "interview-types" || tab === "interview_types" || tab === "rounds") return "interview-types";
    if (tab === "benefit-categories" || tab === "benefit_categories" || tab === "benefits") return "benefit-categories";
    if (tab === "work-modes" || tab === "work_modes") return "work-modes";
    if (tab === "employment-types" || tab === "employment_types") return "employment-types";
    if (tab === "experience-levels" || tab === "experience_levels") return "experience-levels";
    if (tab === "education-levels" || tab === "education_levels") return "education-levels";
    if (tab === "integrations") return "integrations";
    return "company";
  };

  const [activeTab, setActiveTab] = useState(normalizeTab(rawTab));

  const canViewCompany = isSuperAdmin || hasPermission("canManageSettings");
  const canViewRBAC = canManageRBAC;
  const canViewUsers = isSuperAdmin || hasPermission("canManageUsers") || canManageRBAC;
  const canViewDepts = isSuperAdmin || hasPermission("canManageDepartments") || hasPermission("canManageSettings");
  const canViewLocations = isSuperAdmin || hasPermission("canManageLocations") || hasPermission("canManageSettings");
  const canViewCurrencies = isSuperAdmin || hasPermission("canManageSettings");
  const canViewPayFrequencies = isSuperAdmin || hasPermission("canManageSettings");
  const canViewJobStatuses = isSuperAdmin || hasPermission("canManageSettings");
  const canViewInterviewTypes = isSuperAdmin || hasPermission("canManageSettings");
  const canViewBenefitCategories = isSuperAdmin || hasPermission("canManageSettings");
  const canViewWorkModes = isSuperAdmin || hasPermission("canManageWorkModes") || hasPermission("canManageSettings");
  const canViewEmpTypes = isSuperAdmin || hasPermission("canManageEmploymentTypes") || hasPermission("canManageSettings");
  const canViewExpLevels = isSuperAdmin || hasPermission("canManageExperienceLevels") || hasPermission("canManageSettings");
  const canViewEduLevels = isSuperAdmin || hasPermission("canManageEducationLevels") || hasPermission("canManageSettings");
  const canViewSDK = isSuperAdmin || hasPermission("canManageSettings");

  useEffect(() => {
    if (!rawTab) {
      if (canViewCompany) setActiveTab("company");
      else if (canViewDepts) setActiveTab("departments");
      else if (canViewLocations) setActiveTab("locations");
      else if (canViewCurrencies) setActiveTab("currencies");
      else if (canViewPayFrequencies) setActiveTab("pay-frequencies");
      else if (canViewJobStatuses) setActiveTab("job-statuses");
      else if (canViewInterviewTypes) setActiveTab("interview-types");
      else if (canViewBenefitCategories) setActiveTab("benefit-categories");
      else if (canViewWorkModes) setActiveTab("work-modes");
      else if (canViewEmpTypes) setActiveTab("employment-types");
      else if (canViewExpLevels) setActiveTab("experience-levels");
      else if (canViewEduLevels) setActiveTab("education-levels");
      else if (canViewUsers) setActiveTab("users");
      else if (canViewRBAC) setActiveTab("rbac");
      else if (canViewSDK) setActiveTab("integrations");
    } else {
      setActiveTab(normalizeTab(rawTab));
    }
  }, [
    rawTab,
    canViewCompany,
    canViewDepts,
    canViewLocations,
    canViewCurrencies,
    canViewPayFrequencies,
    canViewJobStatuses,
    canViewInterviewTypes,
    canViewBenefitCategories,
    canViewWorkModes,
    canViewEmpTypes,
    canViewExpLevels,
    canViewEduLevels,
    canViewUsers,
    canViewRBAC,
    canViewSDK,
  ]);

  // Data states
  const [, setOrg] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<RoleWithUsers[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [currenciesList, setCurrenciesList] = useState<any[]>([]);
  const [payFrequenciesList, setPayFrequenciesList] = useState<any[]>([]);
  const [jobStatusesList, setJobStatusesList] = useState<any[]>([]);
  const [interviewTypesList, setInterviewTypesList] = useState<any[]>([]);
  const [benefitCategoriesList, setBenefitCategoriesList] = useState<any[]>([]);
  const [workModesList, setWorkModesList] = useState<any[]>([]);
  const [employmentTypesList, setEmploymentTypesList] = useState<any[]>([]);
  const [experienceLevelsList, setExperienceLevelsList] = useState<any[]>([]);
  const [educationLevelsList, setEducationLevelsList] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Org form state
  const [orgName, setOrgName] = useState("");
  const [careersDomain, setCareersDomain] = useState("careers.myorganisation.com");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Create Role Modal
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleBadge, setRoleBadge] = useState("Custom");
  const [rolePerms, setRolePerms] = useState<Set<Permission>>(new Set());
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Edit Role Modal
  const [editingRole, setEditingRole] = useState<RoleWithUsers | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [editRoleBadge, setEditRoleBadge] = useState("");
  const [editRolePerms, setEditRolePerms] = useState<Set<Permission>>(new Set());
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Matrix cell toggling state
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Add User Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("ReqruitBook2026!");
  const [newUserRole, setNewUserRole] = useState<string>("recruiter");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Add Department Modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  // Add Location Modal
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocCountry, setNewLocCountry] = useState("United States");
  const [isCreatingLoc, setIsCreatingLoc] = useState(false);

  // Add Currency Modal
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [newCurrCode, setNewCurrCode] = useState("");
  const [newCurrSymbol, setNewCurrSymbol] = useState("");
  const [newCurrName, setNewCurrName] = useState("");
  const [newCurrDefault, setNewCurrDefault] = useState(false);
  const [isCreatingCurrency, setIsCreatingCurrency] = useState(false);

  // Edit Currency Modal
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [editCurrCode, setEditCurrCode] = useState("");
  const [editCurrSymbol, setEditCurrSymbol] = useState("");
  const [editCurrName, setEditCurrName] = useState("");
  const [editCurrDefault, setEditCurrDefault] = useState(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);

  // Add Pay Frequency Modal
  const [payFreqModalOpen, setPayFreqModalOpen] = useState(false);
  const [newPayFreqName, setNewPayFreqName] = useState("");
  const [newPayFreqSlug, setNewPayFreqSlug] = useState("");
  const [newPayFreqDesc, setNewPayFreqDesc] = useState("");
  const [newPayFreqDefault, setNewPayFreqDefault] = useState(false);
  const [isCreatingPayFreq, setIsCreatingPayFreq] = useState(false);

  // Edit Pay Frequency Modal
  const [editingPayFreq, setEditingPayFreq] = useState<any>(null);
  const [editPayFreqName, setEditPayFreqName] = useState("");
  const [editPayFreqSlug, setEditPayFreqSlug] = useState("");
  const [editPayFreqDesc, setEditPayFreqDesc] = useState("");
  const [editPayFreqDefault, setEditPayFreqDefault] = useState(false);
  const [isUpdatingPayFreq, setIsUpdatingPayFreq] = useState(false);

  // Add Requisition Status Modal
  const [jobStatusModalOpen, setJobStatusModalOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusSlug, setNewStatusSlug] = useState("");
  const [newStatusBadge, setNewStatusBadge] = useState("secondary");
  const [newStatusDesc, setNewStatusDesc] = useState("");
  const [newStatusDefault, setNewStatusDefault] = useState(false);
  const [isCreatingJobStatus, setIsCreatingJobStatus] = useState(false);

  // Edit Requisition Status Modal
  const [editingJobStatus, setEditingJobStatus] = useState<any>(null);
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusSlug, setEditStatusSlug] = useState("");
  const [editStatusBadge, setEditStatusBadge] = useState("secondary");
  const [editStatusDesc, setEditStatusDesc] = useState("");
  const [editStatusDefault, setEditStatusDefault] = useState(false);
  const [isUpdatingJobStatus, setIsUpdatingJobStatus] = useState(false);

  // Add Interview Type Modal
  const [interviewTypeModalOpen, setInterviewTypeModalOpen] = useState(false);
  const [newITypeName, setNewITypeName] = useState("");
  const [newITypeSlug, setNewITypeSlug] = useState("");
  const [newITypeDuration, setNewITypeDuration] = useState(45);
  const [newITypeDesc, setNewITypeDesc] = useState("");
  const [newITypeDefault, setNewITypeDefault] = useState(false);
  const [isCreatingInterviewType, setIsCreatingInterviewType] = useState(false);

  // Edit Interview Type Modal
  const [editingInterviewType, setEditingInterviewType] = useState<any>(null);
  const [editITypeName, setEditITypeName] = useState("");
  const [editITypeSlug, setEditITypeSlug] = useState("");
  const [editITypeDuration, setEditITypeDuration] = useState(45);
  const [editITypeDesc, setEditITypeDesc] = useState("");
  const [editITypeDefault, setEditITypeDefault] = useState(false);
  const [isUpdatingInterviewType, setIsUpdatingInterviewType] = useState(false);

  // Add Benefit Category Modal
  const [benefitCatModalOpen, setBenefitCatModalOpen] = useState(false);
  const [newBCatName, setNewBCatName] = useState("");
  const [newBCatSlug, setNewBCatSlug] = useState("");
  const [newBCatDesc, setNewBCatDesc] = useState("");
  const [newBCatDefault, setNewBCatDefault] = useState(false);
  const [isCreatingBenefitCat, setIsCreatingBenefitCat] = useState(false);

  // Edit Benefit Category Modal
  const [editingBenefitCat, setEditingBenefitCat] = useState<any>(null);
  const [editBCatName, setEditBCatName] = useState("");
  const [editBCatSlug, setEditBCatSlug] = useState("");
  const [editBCatDesc, setEditBCatDesc] = useState("");
  const [editBCatDefault, setEditBCatDefault] = useState(false);
  const [isUpdatingBenefitCat, setIsUpdatingBenefitCat] = useState(false);

  // Add Work Mode Modal
  const [workModeModalOpen, setWorkModeModalOpen] = useState(false);
  const [newWorkModeName, setNewWorkModeName] = useState("");
  const [newWorkModeSlug, setNewWorkModeSlug] = useState("");
  const [newWorkModeDesc, setNewWorkModeDesc] = useState("");
  const [isCreatingWorkMode, setIsCreatingWorkMode] = useState(false);

  // Add Employment Type Modal
  const [empTypeModalOpen, setEmpTypeModalOpen] = useState(false);
  const [newEmpTypeName, setNewEmpTypeName] = useState("");
  const [newEmpTypeSlug, setNewEmpTypeSlug] = useState("");
  const [newEmpTypeDesc, setNewEmpTypeDesc] = useState("");
  const [isCreatingEmpType, setIsCreatingEmpType] = useState(false);

  // Add Experience Level Modal
  const [expLevelModalOpen, setExpLevelModalOpen] = useState(false);
  const [newExpLevelName, setNewExpLevelName] = useState("");
  const [newExpLevelSlug, setNewExpLevelSlug] = useState("");
  const [newExpLevelMinYears, setNewExpLevelMinYears] = useState(0);
  const [newExpLevelMaxYears, setNewExpLevelMaxYears] = useState(2);
  const [newExpLevelDesc, setNewExpLevelDesc] = useState("");
  const [isCreatingExpLevel, setIsCreatingExpLevel] = useState(false);

  // Add Education Level Modal
  const [eduLevelModalOpen, setEduLevelModalOpen] = useState(false);
  const [newEduLevelName, setNewEduLevelName] = useState("");
  const [newEduLevelSlug, setNewEduLevelSlug] = useState("");
  const [newEduLevelDesc, setNewEduLevelDesc] = useState("");
  const [isCreatingEduLevel, setIsCreatingEduLevel] = useState(false);

  // Edit Master Modals State
  const [editingDept, setEditingDept] = useState<any>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptCode, setEditDeptCode] = useState("");
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);

  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [editLocName, setEditLocName] = useState("");
  const [editLocCity, setEditLocCity] = useState("");
  const [editLocCountry, setEditLocCountry] = useState("United States");
  const [isUpdatingLoc, setIsUpdatingLoc] = useState(false);

  const [editingWorkMode, setEditingWorkMode] = useState<any>(null);
  const [editWorkModeName, setEditWorkModeName] = useState("");
  const [editWorkModeSlug, setEditWorkModeSlug] = useState("");
  const [editWorkModeDesc, setEditWorkModeDesc] = useState("");
  const [isUpdatingWorkMode, setIsUpdatingWorkMode] = useState(false);

  const [editingEmpType, setEditingEmpType] = useState<any>(null);
  const [editEmpTypeName, setEditEmpTypeName] = useState("");
  const [editEmpTypeSlug, setEditEmpTypeSlug] = useState("");
  const [editEmpTypeDesc, setEditEmpTypeDesc] = useState("");
  const [isUpdatingEmpType, setIsUpdatingEmpType] = useState(false);

  const [editingExpLevel, setEditingExpLevel] = useState<any>(null);
  const [editExpLevelName, setEditExpLevelName] = useState("");
  const [editExpLevelSlug, setEditExpLevelSlug] = useState("");
  const [editExpLevelMinYears, setEditExpLevelMinYears] = useState(0);
  const [editExpLevelMaxYears, setEditExpLevelMaxYears] = useState(2);
  const [editExpLevelDesc, setEditExpLevelDesc] = useState("");
  const [isUpdatingExpLevel, setIsUpdatingExpLevel] = useState(false);

  const [editingEduLevel, setEditingEduLevel] = useState<any>(null);
  const [editEduLevelName, setEditEduLevelName] = useState("");
  const [editEduLevelSlug, setEditEduLevelSlug] = useState("");
  const [editEduLevelDesc, setEditEduLevelDesc] = useState("");
  const [isUpdatingEduLevel, setIsUpdatingEduLevel] = useState(false);

  const [copied, setCopied] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        orgData,
        uList,
        rList,
        dList,
        lList,
        currList,
        freqList,
        statusList,
        iTypeList,
        bCatList,
        wmList,
        etList,
        expList,
        eduList,
      ] = await Promise.all([
        getOrganizationSettings(),
        getUsers(),
        getRoles(),
        getDepartments(),
        getLocations(),
        getCurrencies(),
        getPayFrequencies(),
        getJobStatuses(),
        getInterviewTypes(),
        getBenefitCategories(),
        getWorkModes(),
        getEmploymentTypes(),
        getExperienceLevels(),
        getEducationLevels(),
      ]);
      setOrg(orgData);
      if (orgData) {
        setOrgName(orgData.name || "My Organisation");
        setCareersDomain(orgData.careersDomain || "careers.myorganisation.com");
        setTimezone(orgData.timezone || "America/Los_Angeles");
        setDefaultCurrency(orgData.defaultCurrency || "USD");
      }
      setUsersList(uList);
      setRolesList(rList);
      setDepartments(dList);
      setLocations(lList);
      setCurrenciesList(currList);
      setPayFrequenciesList(freqList);
      setJobStatusesList(statusList);
      setInterviewTypesList(iTypeList);
      setBenefitCategoriesList(bCatList);
      setWorkModesList(wmList);
      setEmploymentTypesList(etList);
      setExperienceLevelsList(expList);
      setEducationLevelsList(eduList);
      if (rList[0] && !newUserRole) {
        setNewUserRole(rList[0].slug);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(normalizeTab(rawTab));
  }, [rawTab]);

  useEffect(() => {
    loadAll();
  }, []);

  // Responsive Horizontal Tabs Scroll Controller
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const checkTabsScroll = () => {
    if (!tabsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setCanScrollTabsLeft(scrollLeft > 4);
    setCanScrollTabsRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    checkTabsScroll();
    el.addEventListener("scroll", checkTabsScroll, { passive: true });
    window.addEventListener("resize", checkTabsScroll);
    return () => {
      el.removeEventListener("scroll", checkTabsScroll);
      window.removeEventListener("resize", checkTabsScroll);
    };
  }, [rolesList, departments, locations, workModesList, employmentTypesList, experienceLevelsList, educationLevelsList]);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabsScrollRef.current) return;
    const amount = direction === "left" ? -280 : 280;
    tabsScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const targetUrl = value === "company" ? "/settings" : `/settings?tab=${value}`;
    router.replace(targetUrl);
  };

  const handleSaveOrg = async () => {
    setIsSavingOrg(true);
    try {
      await updateOrganizationSettings({
        name: orgName,
        careersDomain,
        timezone,
        defaultCurrency,
      });
      toast.success("Organization details saved!");
      await loadAll();
    } catch {
      toast.error("Failed to update organization");
    } finally {
      setIsSavingOrg(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ROLE CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenCreateRole = () => {
    setRoleName("");
    setRoleSlug("");
    setRoleDesc("");
    setRoleBadge("Custom");
    setRolePerms(new Set(["canManageCandidates", "canAdvancePipeline", "canViewScorecards"]));
    setCreateRoleModalOpen(true);
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role title");
      return;
    }
    setIsCreatingRole(true);
    try {
      await createRole({
        name: roleName,
        slug: roleSlug || undefined,
        description: roleDesc,
        badge: roleBadge,
        permissions: Array.from(rolePerms),
      });
      toast.success(`Custom role '${roleName}' created with ${rolePerms.size} permissions!`);
      setCreateRoleModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom role");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleOpenEditRole = (r: RoleWithUsers) => {
    if (r.slug === "system_admin") {
      toast.info("The root System Administrator role is strictly read-only and cannot be modified.");
      return;
    }
    setEditingRole(r);
    setEditRoleName(r.name);
    setEditRoleDesc(r.description || "");
    setEditRoleBadge(r.badge || "Custom");
    setEditRolePerms(new Set(r.permissions as Permission[]));
  };

  const handleSaveEditRole = async () => {
    if (!editingRole) return;
    setIsUpdatingRole(true);
    try {
      await updateRole(editingRole.id, {
        name: editRoleName,
        description: editRoleDesc,
        badge: editRoleBadge,
        permissions: Array.from(editRolePerms),
      });
      toast.success(`Role '${editRoleName}' updated successfully!`);
      setEditingRole(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteRole = async (r: RoleWithUsers) => {
    if (r.slug === "system_admin" || r.isSystem) {
      toast.error("System Administrator is the root system role and cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete custom role '${r.name}'?`)) return;
    try {
      await deleteRole(r.id);
      toast.success(`Role '${r.name}' deleted.`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  // 1-Click Matrix Toggle
  const handleMatrixToggle = async (role: RoleWithUsers, permKey: Permission) => {
    if (role.slug === "system_admin") {
      toast.info("The root System Administrator maintains all permissions permanently (Read-Only).");
      return;
    }

    const isGranted = (role.permissions as string[]).includes(permKey);
    const keyId = `${role.id}_${permKey}`;
    setTogglingKey(keyId);

    // Optimistic UI update
    setRolesList((prev) =>
      prev.map((r) => {
        if (r.id !== role.id) return r;
        const updated = isGranted
          ? r.permissions.filter((p) => p !== permKey)
          : [...r.permissions, permKey];
        return { ...r, permissions: updated };
      }),
    );

    try {
      await toggleRolePermission(role.id, permKey, !isGranted);
      toast.success(
        !isGranted
          ? `Granted '${permKey}' to ${role.name}`
          : `Revoked '${permKey}' from ${role.name}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle permission");
      await loadAll();
    } finally {
      setTogglingKey(null);
    }
  };

  // ---------------------------------------------------------------------------
  // USER CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("User role updated!");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActive(userId, !currentStatus);
      toast.success(currentStatus ? "User deactivated" : "User activated");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user account "${name}"?`)) return;
    try {
      await deleteUser(userId);
      toast.success(`User ${name} deleted`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error("Please fill in name, email, and password");
      return;
    }
    setIsCreatingUser(true);
    try {
      await createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      toast.success(`User account for ${newUserName} created!`);
      setUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DEPARTMENT & LOCATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateDept = async () => {
    if (!newDeptName || !newDeptCode) {
      toast.error("Please fill in department name and code");
      return;
    }
    setIsCreatingDept(true);
    try {
      await createDepartment({
        name: newDeptName,
        code: newDeptCode.toUpperCase(),
      });
      toast.success(`Department "${newDeptName}" added`);
      setDeptModalOpen(false);
      setNewDeptName("");
      setNewDeptCode("");
      await loadAll();
    } catch {
      toast.error("Failed to add department");
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"?`)) return;
    try {
      await deleteDepartment(id);
      toast.success("Department removed");
      await loadAll();
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const handleCreateLoc = async () => {
    if (!newLocName || !newLocCity) {
      toast.error("Please fill in location title and city");
      return;
    }
    setIsCreatingLoc(true);
    try {
      await createLocation({
        name: newLocName,
        city: newLocCity,
        country: newLocCountry,
      });
      toast.success(`Location "${newLocName}" added`);
      setLocModalOpen(false);
      setNewLocName("");
      setNewLocCity("");
      await loadAll();
    } catch {
      toast.error("Failed to add location");
    } finally {
      setIsCreatingLoc(false);
    }
  };

  const handleDeleteLoc = async (id: string, name: string) => {
    if (!confirm(`Delete location "${name}"?`)) return;
    try {
      await deleteLocation(id);
      toast.success("Location removed");
      await loadAll();
    } catch {
      toast.error("Failed to delete location");
    }
  };

  const handleCreateWorkMode = async () => {
    if (!newWorkModeName.trim()) {
      toast.error("Please enter a work mode name");
      return;
    }
    setIsCreatingWorkMode(true);
    try {
      await createWorkMode({
        name: newWorkModeName.trim(),
        slug: newWorkModeSlug.trim() || undefined,
        description: newWorkModeDesc.trim() || undefined,
      });
      toast.success(`Work mode "${newWorkModeName}" created`);
      setWorkModeModalOpen(false);
      setNewWorkModeName("");
      setNewWorkModeSlug("");
      setNewWorkModeDesc("");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add work mode");
    } finally {
      setIsCreatingWorkMode(false);
    }
  };

  const handleDeleteWorkMode = async (id: string, name: string) => {
    if (!confirm(`Delete work mode "${name}"?`)) return;
    try {
      await deleteWorkMode(id);
      toast.success("Work mode removed");
      await loadAll();
    } catch {
      toast.error("Failed to delete work mode");
    }
  };

  const handleCreateEmpType = async () => {
    if (!newEmpTypeName.trim()) {
      toast.error("Please enter an employment type name");
      return;
    }
    setIsCreatingEmpType(true);
    try {
      await createEmploymentType({
        name: newEmpTypeName.trim(),
        slug: newEmpTypeSlug.trim() || undefined,
        description: newEmpTypeDesc.trim() || undefined,
      });
      toast.success(`Employment type "${newEmpTypeName}" created`);
      setEmpTypeModalOpen(false);
      setNewEmpTypeName("");
      setNewEmpTypeSlug("");
      setNewEmpTypeDesc("");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add employment type");
    } finally {
      setIsCreatingEmpType(false);
    }
  };

  const handleDeleteEmpType = async (id: string, name: string) => {
    if (!confirm(`Delete employment type "${name}"?`)) return;
    try {
      await deleteEmploymentType(id);
      toast.success("Employment type removed");
      await loadAll();
    } catch {
      toast.error("Failed to delete employment type");
    }
  };

  // Edit Department Handlers
  const handleOpenEditDept = (dept: any) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptCode(dept.code);
  };

  const handleSaveEditDept = async () => {
    if (!editingDept || !editDeptName.trim() || !editDeptCode.trim()) {
      toast.error("Please fill in department name and code");
      return;
    }
    setIsUpdatingDept(true);
    try {
      await updateDepartment(editingDept.id, {
        name: editDeptName.trim(),
        code: editDeptCode.trim().toUpperCase(),
      });
      toast.success("Department updated successfully");
      setEditingDept(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update department");
    } finally {
      setIsUpdatingDept(false);
    }
  };

  // Edit Location Handlers
  const handleOpenEditLoc = (loc: any) => {
    setEditingLoc(loc);
    setEditLocName(loc.name);
    setEditLocCity(loc.city);
    setEditLocCountry(loc.country || "United States");
  };

  const handleSaveEditLoc = async () => {
    if (!editingLoc || !editLocName.trim() || !editLocCity.trim()) {
      toast.error("Please fill in location name and city");
      return;
    }
    setIsUpdatingLoc(true);
    try {
      await updateLocation(editingLoc.id, {
        name: editLocName.trim(),
        city: editLocCity.trim(),
        country: editLocCountry.trim(),
      });
      toast.success("Location updated successfully");
      setEditingLoc(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update location");
    } finally {
      setIsUpdatingLoc(false);
    }
  };

  // Edit Work Mode Handlers
  const handleOpenEditWorkMode = (wm: any) => {
    setEditingWorkMode(wm);
    setEditWorkModeName(wm.name);
    setEditWorkModeSlug(wm.slug);
    setEditWorkModeDesc(wm.description || "");
  };

  const handleSaveEditWorkMode = async () => {
    if (!editingWorkMode || !editWorkModeName.trim()) {
      toast.error("Please enter a work mode name");
      return;
    }
    setIsUpdatingWorkMode(true);
    try {
      await updateWorkMode(editingWorkMode.id, {
        name: editWorkModeName.trim(),
        slug: editWorkModeSlug.trim() || undefined,
        description: editWorkModeDesc.trim() || undefined,
      });
      toast.success("Work mode updated successfully");
      setEditingWorkMode(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update work mode");
    } finally {
      setIsUpdatingWorkMode(false);
    }
  };

  // Edit Employment Type Handlers
  const handleOpenEditEmpType = (et: any) => {
    setEditingEmpType(et);
    setEditEmpTypeName(et.name);
    setEditEmpTypeSlug(et.slug);
    setEditEmpTypeDesc(et.description || "");
  };

  const handleSaveEditEmpType = async () => {
    if (!editingEmpType || !editEmpTypeName.trim()) {
      toast.error("Please enter an employment type name");
      return;
    }
    setIsUpdatingEmpType(true);
    try {
      await updateEmploymentType(editingEmpType.id, {
        name: editEmpTypeName.trim(),
        slug: editEmpTypeSlug.trim() || undefined,
        description: editEmpTypeDesc.trim() || undefined,
      });
      toast.success("Employment type updated successfully");
      setEditingEmpType(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update employment type");
    } finally {
      setIsUpdatingEmpType(false);
    }
  };

  // Create Experience Level Handler
  const handleCreateExpLevel = async () => {
    if (!newExpLevelName.trim()) {
      toast.error("Please enter an experience level name");
      return;
    }
    setIsCreatingExpLevel(true);
    try {
      await createExperienceLevel({
        name: newExpLevelName.trim(),
        slug: newExpLevelSlug.trim() || undefined,
        minYears: Number(newExpLevelMinYears) || 0,
        maxYears: Number(newExpLevelMaxYears) || 0,
        description: newExpLevelDesc.trim() || undefined,
      });
      toast.success(`Experience level "${newExpLevelName}" added`);
      setExpLevelModalOpen(false);
      setNewExpLevelName("");
      setNewExpLevelSlug("");
      setNewExpLevelMinYears(0);
      setNewExpLevelMaxYears(2);
      setNewExpLevelDesc("");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add experience level");
    } finally {
      setIsCreatingExpLevel(false);
    }
  };

  const handleOpenEditExpLevel = (exp: any) => {
    setEditingExpLevel(exp);
    setEditExpLevelName(exp.name);
    setEditExpLevelSlug(exp.slug);
    setEditExpLevelMinYears(exp.minYears ?? 0);
    setEditExpLevelMaxYears(exp.maxYears ?? 0);
    setEditExpLevelDesc(exp.description || "");
  };

  const handleSaveEditExpLevel = async () => {
    if (!editingExpLevel || !editExpLevelName.trim()) {
      toast.error("Please enter an experience level name");
      return;
    }
    setIsUpdatingExpLevel(true);
    try {
      await updateExperienceLevel(editingExpLevel.id, {
        name: editExpLevelName.trim(),
        slug: editExpLevelSlug.trim() || undefined,
        minYears: Number(editExpLevelMinYears),
        maxYears: Number(editExpLevelMaxYears),
        description: editExpLevelDesc.trim() || undefined,
      });
      toast.success("Experience level updated successfully");
      setEditingExpLevel(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update experience level");
    } finally {
      setIsUpdatingExpLevel(false);
    }
  };

  const handleDeleteExpLevel = async (id: string, name: string) => {
    if (!confirm(`Permanently remove experience level "${name}"?`)) return;
    try {
      await deleteExperienceLevel(id);
      toast.success(`Removed experience level: ${name}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete experience level");
    }
  };

  // Create Education Level Handler
  const handleCreateEduLevel = async () => {
    if (!newEduLevelName.trim()) {
      toast.error("Please enter an education level name");
      return;
    }
    setIsCreatingEduLevel(true);
    try {
      await createEducationLevel({
        name: newEduLevelName.trim(),
        slug: newEduLevelSlug.trim() || undefined,
        description: newEduLevelDesc.trim() || undefined,
      });
      toast.success(`Education requirement "${newEduLevelName}" added`);
      setEduLevelModalOpen(false);
      setNewEduLevelName("");
      setNewEduLevelSlug("");
      setNewEduLevelDesc("");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add education requirement");
    } finally {
      setIsCreatingEduLevel(false);
    }
  };

  const handleOpenEditEduLevel = (edu: any) => {
    setEditingEduLevel(edu);
    setEditEduLevelName(edu.name);
    setEditEduLevelSlug(edu.slug);
    setEditEduLevelDesc(edu.description || "");
  };

  const handleSaveEditEduLevel = async () => {
    if (!editingEduLevel || !editEduLevelName.trim()) {
      toast.error("Please enter an education requirement name");
      return;
    }
    setIsUpdatingEduLevel(true);
    try {
      await updateEducationLevel(editingEduLevel.id, {
        name: editEduLevelName.trim(),
        slug: editEduLevelSlug.trim() || undefined,
        description: editEduLevelDesc.trim() || undefined,
      });
      toast.success("Education requirement updated successfully");
      setEditingEduLevel(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update education requirement");
    } finally {
      setIsUpdatingEduLevel(false);
    }
  };

  const handleDeleteEduLevel = async (id: string, name: string) => {
    if (!confirm(`Permanently remove education requirement "${name}"?`)) return;
    try {
      await deleteEducationLevel(id);
      toast.success(`Removed education requirement: ${name}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete education requirement");
    }
  };

  // ---------------------------------------------------------------------------
  // CURRENCIES CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateCurrency = async () => {
    if (!newCurrCode.trim() || !newCurrSymbol.trim() || !newCurrName.trim()) {
      toast.error("Please provide currency code, symbol, and name");
      return;
    }
    setIsCreatingCurrency(true);
    try {
      await createCurrency({
        code: newCurrCode.trim().toUpperCase(),
        symbol: newCurrSymbol.trim(),
        name: newCurrName.trim(),
        isDefault: newCurrDefault,
      });
      toast.success(`Currency "${newCurrCode.toUpperCase()}" added`);
      setCurrencyModalOpen(false);
      setNewCurrCode("");
      setNewCurrSymbol("");
      setNewCurrName("");
      setNewCurrDefault(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add currency");
    } finally {
      setIsCreatingCurrency(false);
    }
  };

  const handleOpenEditCurrency = (curr: any) => {
    setEditingCurrency(curr);
    setEditCurrCode(curr.code);
    setEditCurrSymbol(curr.symbol);
    setEditCurrName(curr.name);
    setEditCurrDefault(curr.isDefault || false);
  };

  const handleSaveEditCurrency = async () => {
    if (!editingCurrency || !editCurrCode.trim() || !editCurrSymbol.trim() || !editCurrName.trim()) {
      toast.error("Please provide currency code, symbol, and name");
      return;
    }
    setIsUpdatingCurrency(true);
    try {
      await updateCurrency(editingCurrency.id, {
        code: editCurrCode.trim().toUpperCase(),
        symbol: editCurrSymbol.trim(),
        name: editCurrName.trim(),
        isDefault: editCurrDefault,
      });
      toast.success("Currency updated successfully");
      setEditingCurrency(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update currency");
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const handleDeleteCurrency = async (id: string, code: string) => {
    if (!confirm(`Permanently remove currency "${code}"?`)) return;
    try {
      await deleteCurrency(id);
      toast.success(`Removed currency: ${code}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete currency");
    }
  };

  // ---------------------------------------------------------------------------
  // PAY FREQUENCIES CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreatePayFreq = async () => {
    if (!newPayFreqName.trim()) {
      toast.error("Please enter a pay frequency name");
      return;
    }
    setIsCreatingPayFreq(true);
    try {
      await createPayFrequency({
        name: newPayFreqName.trim(),
        slug: newPayFreqSlug.trim() || undefined,
        description: newPayFreqDesc.trim() || undefined,
        isDefault: newPayFreqDefault,
      });
      toast.success(`Pay frequency "${newPayFreqName}" added`);
      setPayFreqModalOpen(false);
      setNewPayFreqName("");
      setNewPayFreqSlug("");
      setNewPayFreqDesc("");
      setNewPayFreqDefault(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add pay frequency");
    } finally {
      setIsCreatingPayFreq(false);
    }
  };

  const handleOpenEditPayFreq = (freq: any) => {
    setEditingPayFreq(freq);
    setEditPayFreqName(freq.name);
    setEditPayFreqSlug(freq.slug);
    setEditPayFreqDesc(freq.description || "");
    setEditPayFreqDefault(freq.isDefault || false);
  };

  const handleSaveEditPayFreq = async () => {
    if (!editingPayFreq || !editPayFreqName.trim()) {
      toast.error("Please enter a pay frequency name");
      return;
    }
    setIsUpdatingPayFreq(true);
    try {
      await updatePayFrequency(editingPayFreq.id, {
        name: editPayFreqName.trim(),
        slug: editPayFreqSlug.trim() || undefined,
        description: editPayFreqDesc.trim() || undefined,
        isDefault: editPayFreqDefault,
      });
      toast.success("Pay frequency updated successfully");
      setEditingPayFreq(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update pay frequency");
    } finally {
      setIsUpdatingPayFreq(false);
    }
  };

  const handleDeletePayFreq = async (id: string, name: string) => {
    if (!confirm(`Permanently remove pay frequency "${name}"?`)) return;
    try {
      await deletePayFrequency(id);
      toast.success(`Removed pay frequency: ${name}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete pay frequency");
    }
  };

  // ---------------------------------------------------------------------------
  // JOB STATUSES CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateJobStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error("Please enter a requisition status name");
      return;
    }
    setIsCreatingJobStatus(true);
    try {
      await createJobStatus({
        name: newStatusName.trim(),
        slug: newStatusSlug.trim() || undefined,
        badgeVariant: newStatusBadge,
        description: newStatusDesc.trim() || undefined,
        isDefault: newStatusDefault,
      });
      toast.success(`Requisition status "${newStatusName}" added`);
      setJobStatusModalOpen(false);
      setNewStatusName("");
      setNewStatusSlug("");
      setNewStatusDesc("");
      setNewStatusDefault(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add requisition status");
    } finally {
      setIsCreatingJobStatus(false);
    }
  };

  const handleOpenEditJobStatus = (status: any) => {
    setEditingJobStatus(status);
    setEditStatusName(status.name);
    setEditStatusSlug(status.slug);
    setEditStatusBadge(status.badgeVariant || "secondary");
    setEditStatusDesc(status.description || "");
    setEditStatusDefault(status.isDefault || false);
  };

  const handleSaveEditJobStatus = async () => {
    if (!editingJobStatus || !editStatusName.trim()) {
      toast.error("Please enter a status name");
      return;
    }
    setIsUpdatingJobStatus(true);
    try {
      await updateJobStatus(editingJobStatus.id, {
        name: editStatusName.trim(),
        slug: editStatusSlug.trim() || undefined,
        badgeVariant: editStatusBadge,
        description: editStatusDesc.trim() || undefined,
        isDefault: editStatusDefault,
      });
      toast.success("Requisition status updated successfully");
      setEditingJobStatus(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update requisition status");
    } finally {
      setIsUpdatingJobStatus(false);
    }
  };

  const handleDeleteJobStatus = async (id: string, name: string) => {
    if (!confirm(`Permanently remove requisition status "${name}"?`)) return;
    try {
      await deleteJobStatus(id);
      toast.success(`Removed requisition status: ${name}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete requisition status");
    }
  };

  // ---------------------------------------------------------------------------
  // INTERVIEW ROUND TYPES CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateInterviewType = async () => {
    if (!newITypeName.trim()) {
      toast.error("Please enter an interview round type name");
      return;
    }
    setIsCreatingInterviewType(true);
    try {
      await createInterviewType({
        name: newITypeName.trim(),
        slug: newITypeSlug.trim() || undefined,
        defaultDurationMinutes: Number(newITypeDuration) || 45,
        description: newITypeDesc.trim() || undefined,
        isDefault: newITypeDefault,
      });
      toast.success(`Interview type "${newITypeName}" added`);
      setInterviewTypeModalOpen(false);
      setNewITypeName("");
      setNewITypeSlug("");
      setNewITypeDuration(45);
      setNewITypeDesc("");
      setNewITypeDefault(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add interview type");
    } finally {
      setIsCreatingInterviewType(false);
    }
  };

  const handleOpenEditInterviewType = (itype: any) => {
    setEditingInterviewType(itype);
    setEditITypeName(itype.name);
    setEditITypeSlug(itype.slug);
    setEditITypeDuration(itype.defaultDurationMinutes || 45);
    setEditITypeDesc(itype.description || "");
    setEditITypeDefault(itype.isDefault || false);
  };

  const handleSaveEditInterviewType = async () => {
    if (!editingInterviewType || !editITypeName.trim()) {
      toast.error("Please enter an interview type name");
      return;
    }
    setIsUpdatingInterviewType(true);
    try {
      await updateInterviewType(editingInterviewType.id, {
        name: editITypeName.trim(),
        slug: editITypeSlug.trim() || undefined,
        defaultDurationMinutes: Number(editITypeDuration) || 45,
        description: editITypeDesc.trim() || undefined,
        isDefault: editITypeDefault,
      });
      toast.success("Interview round type updated successfully");
      setEditingInterviewType(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update interview type");
    } finally {
      setIsUpdatingInterviewType(false);
    }
  };

  const handleDeleteInterviewType = async (id: string, name: string) => {
    if (!confirm(`Permanently remove interview round type "${name}"?`)) return;
    try {
      await deleteInterviewType(id);
      toast.success(`Removed interview round type: ${name}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete interview round type");
    }
  };

  // ---------------------------------------------------------------------------
  // BENEFIT CATEGORIES CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateBenefitCat = async () => {
    if (!newBCatName.trim()) {
      toast.error("Please enter a benefit category name");
      return;
    }
    setIsCreatingBenefitCat(true);
    try {
      await createBenefitCategory({
        name: newBCatName.trim(),
        slug: newBCatSlug.trim() || undefined,
        description: newBCatDesc.trim() || undefined,
        isDefault: newBCatDefault,
      });
      toast.success(`Benefit category "${newBCatName}" added`);
      setBenefitCatModalOpen(false);
      setNewBCatName("");
      setNewBCatSlug("");
      setNewBCatDesc("");
      setNewBCatDefault(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add benefit category");
    } finally {
      setIsCreatingBenefitCat(false);
    }
  };

  const handleOpenEditBenefitCat = (bcat: any) => {
    setEditingBenefitCat(bcat);
    setEditBCatName(bcat.name);
    setEditBCatSlug(bcat.slug);
    setEditBCatDesc(bcat.description || "");
    setEditBCatDefault(bcat.isDefault || false);
  };

  const handleSaveEditBenefitCat = async () => {
    if (!editingBenefitCat || !editBCatName.trim()) {
      toast.error("Please enter a benefit category name");
      return;
    }
    setIsUpdatingBenefitCat(true);
    try {
      await updateBenefitCategory(editingBenefitCat.id, {
        name: editBCatName.trim(),
        slug: editBCatSlug.trim() || undefined,
        description: editBCatDesc.trim() || undefined,
        isDefault: editBCatDefault,
      });
      toast.success("Benefit category updated successfully");
      setEditingBenefitCat(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update benefit category");
    } finally {
      setIsUpdatingBenefitCat(false);
    }
  };

  const handleDeleteBenefitCat = async (id: string, name: string) => {
    if (!confirm(`Permanently remove benefit category "${name}"?`)) return;
    try {
      await deleteBenefitCategory(id);
      toast.success(`Removed benefit category: ${name}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete benefit category");
    }
  };

  const embedCodeSnippet = `// 1. Host Application React Microfrontend Import
import { ReqruitBookEmbedContainer, CandidatePipelineEmbed } from "@reqruitbook/embed-sdk";

export function HostHrmRecruitmentView() {
  return (
    <ReqruitBookEmbedContainer
      config={{
        isEmbedded: true,
        hostName: "My Organisation HRM & Payroll Suite",
        theme: "light",
        onCandidateHired: (candidate) => {
          console.log("Candidate converted to HRM Employee:", candidate);
        },
      }}
    >
      <CandidatePipelineEmbed departmentId="dept_eng" />
    </ReqruitBookEmbedContainer>
  );
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopied(true);
    toast.success("Microfrontend embed snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page w-full max-w-full min-w-0">
      <PageHeader
        title="System &amp; Access Control Settings"
        description="Manage company details, dynamic database-persisted RBAC roles, live permission matrices, departments, and HRM microfrontend bridges."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 w-full max-w-full min-w-0">
        {/* Responsive Horizontal Scroll Tabs Container */}
        <div className="relative w-full max-w-full group">
          {/* Left Edge Fading Mask & Floating Chevron */}
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-background via-background/90 to-transparent z-20 transition-all duration-200 flex items-center justify-start pl-0.5",
              canScrollTabsLeft ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              disabled={!canScrollTabsLeft}
              aria-label="Scroll tabs left"
              className="pointer-events-auto size-7 rounded-full bg-card/95 hover:bg-card border border-border hover:border-copper shadow-md text-foreground hover:text-copper flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          {/* Scrollable Tabs List Viewport */}
          <div
            ref={tabsScrollRef}
            className="w-full max-w-full overflow-x-auto no-scrollbar scroll-smooth border-b border-border px-0"
          >
            <TabsList className="mb-0 border-b-0 inline-flex w-max gap-4 p-0 h-9">
              {canViewCompany && (
                <TabsTrigger value="company" className="shrink-0 whitespace-nowrap">
                  Company &amp; Branding
                </TabsTrigger>
              )}
              {canViewRBAC && (
                <TabsTrigger value="rbac" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <ShieldCheck className="size-3.5 text-copper" />
                  <span>Roles &amp; Permissions (RBAC)</span>
                </TabsTrigger>
              )}
              {canViewUsers && (
                <TabsTrigger value="users" className="shrink-0 whitespace-nowrap">
                  Users &amp; Directory ({usersList.length})
                </TabsTrigger>
              )}
              {canViewDepts && (
                <TabsTrigger value="departments" className="shrink-0 whitespace-nowrap">
                  Departments ({departments.length})
                </TabsTrigger>
              )}
              {canViewLocations && (
                <TabsTrigger value="locations" className="shrink-0 whitespace-nowrap">
                  Locations ({locations.length})
                </TabsTrigger>
              )}
              {canViewCurrencies && (
                <TabsTrigger value="currencies" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Coins className="size-3.5 text-copper" />
                  <span>Currencies ({currenciesList.length})</span>
                </TabsTrigger>
              )}
              {canViewPayFrequencies && (
                <TabsTrigger value="pay-frequencies" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Clock className="size-3.5 text-copper" />
                  <span>Pay Frequencies ({payFrequenciesList.length})</span>
                </TabsTrigger>
              )}
              {canViewJobStatuses && (
                <TabsTrigger value="job-statuses" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Tag className="size-3.5 text-copper" />
                  <span>Requisition Statuses ({jobStatusesList.length})</span>
                </TabsTrigger>
              )}
              {canViewInterviewTypes && (
                <TabsTrigger value="interview-types" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CalendarDays className="size-3.5 text-copper" />
                  <span>Interview Rounds ({interviewTypesList.length})</span>
                </TabsTrigger>
              )}
              {canViewBenefitCategories && (
                <TabsTrigger value="benefit-categories" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Layers className="size-3.5 text-copper" />
                  <span>Benefit Categories ({benefitCategoriesList.length})</span>
                </TabsTrigger>
              )}
              {canViewWorkModes && (
                <TabsTrigger value="work-modes" className="shrink-0 whitespace-nowrap">
                  Work Modes ({workModesList.length})
                </TabsTrigger>
              )}
              {canViewEmpTypes && (
                <TabsTrigger value="employment-types" className="shrink-0 whitespace-nowrap">
                  Employment Types ({employmentTypesList.length})
                </TabsTrigger>
              )}
              {canViewExpLevels && (
                <TabsTrigger value="experience-levels" className="shrink-0 whitespace-nowrap">
                  Experience Levels ({experienceLevelsList.length})
                </TabsTrigger>
              )}
              {canViewEduLevels && (
                <TabsTrigger value="education-levels" className="shrink-0 whitespace-nowrap">
                  Education Requirements ({educationLevelsList.length})
                </TabsTrigger>
              )}
              {canViewSDK && (
                <TabsTrigger value="integrations" className="shrink-0 whitespace-nowrap">
                  Microfrontend SDK
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Right Edge Fading Mask & Floating Chevron */}
          <div
            className={cn(
              "pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-background via-background/90 to-transparent z-20 transition-all duration-200 flex items-center justify-end pr-0.5",
              canScrollTabsRight ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              disabled={!canScrollTabsRight}
              aria-label="Scroll tabs right"
              className="pointer-events-auto size-7 rounded-full bg-card/95 hover:bg-card border border-border hover:border-copper shadow-md text-foreground hover:text-copper flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* 1. COMPANY & BRANDING */}
        {canViewCompany && (
          <TabsContent value="company" className="space-y-4 w-full max-w-full min-w-0">
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Organization Profile</CardTitle>
                <CardDescription className="text-xs">
                  Company identity shown on applicant portal and offer letters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs max-w-xl">
                <div className="space-y-1.5">
                  <label className="field-label">Organization Name</label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="field-label">Careers Portal Subdomain</label>
                  <Input
                    value={careersDomain}
                    onChange={(e) => setCareersDomain(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="field-label">Primary Timezone</label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="field-label">Default Reporting Currency</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="h-8 w-full rounded-xs border border-border bg-card px-2.5 text-xs text-foreground focus:border-ring"
                  >
                    {currenciesList.length === 0 ? (
                      <option value="USD">USD ($)</option>
                    ) : (
                      currenciesList.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    size="xs"
                    variant="accent"
                    disabled={isSavingOrg}
                    onClick={handleSaveOrg}
                    className="gap-1"
                  >
                    {isSavingOrg ? <Loader2 className="size-3 animate-spin" /> : null}
                    <span>Save Organization Profile</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 2. DYNAMIC RBAC ROLES & PERMISSIONS */}
        <TabsContent value="rbac" className="space-y-6 w-full max-w-full min-w-0">
          {!canViewRBAC ? (
            <AccessDenied
              errorCode="403"
              title="Access Denied"
              description="You do not have permission to view or manage RBAC roles."
              showBackHome={false}
            />
          ) : (
            <>
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card rounded-xs border border-border">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-copper" />
                    <span>Dynamic Database-Driven Roles &amp; Permissions</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Create custom roles, delegate role governance, and customize granular permissions across all modules.
                  </p>
                </div>
                <RoleGuard permission="canAssignRoles">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={handleOpenCreateRole}
                    className="gap-1 text-xs shrink-0"
                  >
                    <Plus className="size-3.5" />
                    <span>Create Custom Role</span>
                  </Button>
                </RoleGuard>
              </div>

              {/* Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rolesList.map((r) => {
                  const isRootAdmin = r.slug === "system_admin";
                  return (
                    <Card
                      key={r.id}
                      className="shadow-none border border-border hover:border-copper/60 transition-all flex flex-col justify-between"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-sm font-semibold">{r.name}</CardTitle>
                              {isRootAdmin ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] uppercase tracking-wider bg-copper/10 text-copper border-copper/30 flex items-center gap-1"
                                >
                                  <Lock className="size-2.5" />
                                  <span>Read-Only Root</span>
                                </Badge>
                              ) : (
                                <Badge
                                  variant={r.isSystem ? "secondary" : "soft-success"}
                                  className="text-[9px] uppercase tracking-wider"
                                >
                                  {r.isSystem ? "System" : "Custom"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              slug: {r.slug}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {r.userCount || 0} {(r.userCount || 0) === 1 ? "user" : "users"}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs line-clamp-2 mt-1">
                          {isRootAdmin
                            ? "Universal administrator with permanent full permissions across all systems. Strictly read-only for all users."
                            : r.description || "Custom defined role with tailored permissions."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
                          <span>
                            <strong className="text-foreground">
                              {isRootAdmin ? ALL_PERMISSIONS.length : r.permissions.length}
                            </strong>{" "}
                            of {ALL_PERMISSIONS.length} permissions granted
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {r.badge || "Role"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60">
                          {isRootAdmin ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1 h-7 px-2 bg-muted/30">
                              <Lock className="size-3 text-copper" />
                              <span>Read-Only</span>
                            </Badge>
                          ) : (
                            <RoleGuard permission="canAssignRoles">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleOpenEditRole(r)}
                                className="h-7 px-2.5 text-xs gap-1"
                              >
                                <Edit2 className="size-3" />
                                <span>Edit Permissions</span>
                              </Button>

                              {!r.isSystem && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => handleDeleteRole(r)}
                                  className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Custom Role"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </RoleGuard>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Live RBAC Permission Matrix */}
              <Card className="shadow-none overflow-hidden">
                <CardHeader className="pb-3 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ShieldCheck className="size-4 text-copper" />
                        <span>Interactive Real-Time RBAC Permission Matrix</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Click any cell to immediately grant or revoke permissions on Neon PostgreSQL database
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Check className="size-3 text-success font-bold" />
                        <span>Granted</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <X className="size-3 text-muted-foreground/40 font-bold" />
                        <span>Denied</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Lock className="size-3 text-copper" />
                        <span>Read-Only</span>
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs bg-muted/40">
                        <TableHead className="w-80 min-w-70">Feature &amp; Capability</TableHead>
                        {rolesList.map((r) => (
                          <TableHead key={r.id} className="text-center min-w-30">
                            <div>
                              <span className="font-semibold text-foreground text-xs block">{r.name}</span>
                              <span className="text-[9px] text-muted-foreground">
                                {r.slug === "system_admin" ? "read-only root" : r.isSystem ? "system" : "custom"}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PERMISSION_CATEGORIES.map((cat) => {
                        const catPerms = ALL_PERMISSIONS.filter((p) => p.category === cat.id);
                        return (
                          <React.Fragment key={cat.id}>
                            {/* Category Divider Header */}
                            <TableRow className="bg-muted/60 text-xs font-semibold text-foreground">
                              <TableCell colSpan={rolesList.length + 1} className="py-1.5 text-copper uppercase tracking-wider text-[10px]">
                                {cat.name}
                              </TableCell>
                            </TableRow>

                            {/* Category Permissions */}
                            {catPerms.map((perm) => (
                              <TableRow key={perm.key} className="text-xs hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium">
                                  <div className="font-semibold text-foreground text-xs">{perm.label}</div>
                                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                    {perm.description}
                                  </div>
                                </TableCell>
                                {rolesList.map((r) => {
                                  const isRootAdmin = r.slug === "system_admin";
                                  const isGranted = isRootAdmin || (r.permissions as string[]).includes(perm.key);
                                  const isCellToggling = togglingKey === `${r.id}_${perm.key}`;

                                  if (isRootAdmin) {
                                    return (
                                      <TableCell key={r.id} className="text-center">
                                        <div
                                          className="inline-flex items-center justify-center size-6 rounded-xs bg-copper/10 border border-copper/30 text-copper cursor-not-allowed"
                                          title="System Administrator maintains full access and is permanently read-only / immutable."
                                        >
                                          <Check className="size-3.5 stroke-[2.5]" />
                                        </div>
                                      </TableCell>
                                    );
                                  }

                                  return (
                                    <TableCell key={r.id} className="text-center">
                                      <button
                                        onClick={() => handleMatrixToggle(r, perm.key)}
                                        disabled={isCellToggling}
                                        title={`Click to ${isGranted ? "revoke" : "grant"} ${perm.label} for ${r.name}`}
                                        className={`inline-flex items-center justify-center size-6 rounded-xs border transition-all ${ isGranted ? "bg-success/15 border-success/40 text-success hover:bg-destructive/20 hover:text-destructive hover:border-destructive" : "bg-muted/40 border-border text-muted-foreground/30 hover:bg-success/20 hover:text-success hover:border-success" }`}
                                      >
                                        {isCellToggling ? (
                                          <Loader2 className="size-3 animate-spin text-copper" />
                                        ) : isGranted ? (
                                          <Check className="size-3.5 stroke-[2.5]" />
                                        ) : (
                                          <X className="size-3 stroke-2" />
                                        )}
                                      </button>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 3. USERS & DIRECTORY */}
        {canViewUsers && (
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Manage internal recruiter access, team members, and role assignments.
              </div>
              <RoleGuard permission="canManageUsers">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setUserModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <UserPlus className="size-3.5" />
                  <span>Invite User</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>User &amp; Email</TH>
                  <TH>Assigned Role</TH>
                  <TH>Department</TH>
                  <TH>Status</TH>
                  <TH>Created Date</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {usersList.map((u) => {
                    const isPrimaryAdmin = u.email === "admin@myorganisation.com";
                    return (
                      <TR key={u.id}>
                        <TD>
                          <div>
                            <span className="font-semibold text-foreground text-xs block">{u.name}</span>
                            <span className="text-[11px] text-muted-foreground">{u.email}</span>
                          </div>
                        </TD>

                        <TD>
                          {isPrimaryAdmin ? (
                            <Badge variant="secondary" className="text-[10px] bg-copper/10 text-copper border-copper/30 gap-1">
                              <Lock className="size-2.5" />
                              <span>System Administrator (Read-Only)</span>
                            </Badge>
                          ) : (
                            <RoleGuard
                              permission="canAssignRoles"
                              fallback={
                                <Badge variant="outline" className="text-[10px]">
                                  {rolesList.find((r) => r.slug === u.role)?.name || u.role}
                                </Badge>
                              }
                            >
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="h-7 text-xs rounded-xs border border-border bg-card px-2 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-copper"
                              >
                                {rolesList.map((r) => (
                                  <option key={r.id} value={r.slug}>
                                    {r.name} {r.slug === "system_admin" ? "(Root Admin)" : r.isSystem ? "(System)" : "(Custom)"}
                                  </option>
                                ))}
                              </select>
                            </RoleGuard>
                          )}
                        </TD>

                        <TD>
                          <span className="text-muted-foreground text-xs">
                            {u.departmentName || "General Operations"}
                          </span>
                        </TD>

                        <TD>
                          {u.isActive ? (
                            <Badge variant="soft-success" className="text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Deactivated
                            </Badge>
                          )}
                        </TD>

                        <TD className="text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TD>

                        <TD align="right">
                          {!isPrimaryAdmin && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleToggleUserActive(u.id, u.isActive)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 4. DEPARTMENTS */}
        {canViewDepts && (
          <TabsContent value="departments" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Define functional departments for requisitions and workforce allocation.
              </div>
              <RoleGuard permission="canManageDepartments">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setDeptModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Department</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Department Name</TH>
                  <TH>Department Code</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {departments.length === 0 ? (
                    <EmptyRow colSpan={3}>No departments found.</EmptyRow>
                  ) : (
                    departments.map((dept) => (
                      <TR key={dept.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{dept.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {dept.code}
                          </Badge>
                        </TD>
                        <TD align="right">
                          <RoleGuard permission="canManageDepartments">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditDept(dept)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteDept(dept.id, dept.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 5. LOCATIONS */}
        {canViewLocations && (
          <TabsContent value="locations" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Configure global office locations and hiring hubs.
              </div>
              <RoleGuard permission="canManageLocations">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setLocModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Office Hub</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Office Location</TH>
                  <TH>City</TH>
                  <TH>Country</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {locations.length === 0 ? (
                    <EmptyRow colSpan={4}>No office hubs found.</EmptyRow>
                  ) : (
                    locations.map((loc) => (
                      <TR key={loc.id}>
                        <TD>
                          <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                            <MapPin className="size-3.5 text-copper shrink-0" />
                            <span>{loc.name}</span>
                          </div>
                        </TD>
                        <TD>
                          <span className="text-xs text-foreground">{loc.city}</span>
                        </TD>
                        <TD>
                          <span className="text-xs text-muted-foreground">{loc.country}</span>
                        </TD>
                        <TD align="right">
                          <RoleGuard permission="canManageLocations">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditLoc(loc)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteLoc(loc.id, loc.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 5a. CURRENCIES MASTER */}
        {canViewCurrencies && (
          <TabsContent value="currencies" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Configure global transaction and compensation currencies used across job requisitions and candidate offer letters.
              </div>
              <RoleGuard permission="canManageSettings">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setCurrencyModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Currency</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Currency Code</TH>
                  <TH>Symbol</TH>
                  <TH>Full Name</TH>
                  <TH>Default Status</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {currenciesList.length === 0 ? (
                    <EmptyRow colSpan={5}>No currencies found.</EmptyRow>
                  ) : (
                    currenciesList.map((c) => (
                      <TR key={c.id}>
                        <TD mono>
                          <span className="font-semibold text-xs text-foreground uppercase">{c.code}</span>
                        </TD>
                        <TD>
                          <Badge variant="outline" className="text-[11px] font-bold border-copper/30 text-copper">
                            {c.symbol}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-xs text-foreground font-medium">{c.name}</span>
                        </TD>
                        <TD>
                          {c.isDefault ? (
                            <Badge variant="soft-success" className="text-[10px]">
                              Default Base
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TD>
                        <TD align="right">
                          <RoleGuard permission="canManageSettings">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditCurrency(c)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteCurrency(c.id, c.code)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 5b. PAY FREQUENCIES MASTER */}
        {canViewPayFrequencies && (
          <TabsContent value="pay-frequencies" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Define payroll and salary frequency intervals (e.g. Annual, Monthly, Hourly, Bi-Weekly) for compensation packaging.
              </div>
              <RoleGuard permission="canManageSettings">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setPayFreqModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Pay Frequency</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Pay Frequency</TH>
                  <TH>Slug / Code</TH>
                  <TH>Description</TH>
                  <TH>Default</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {payFrequenciesList.length === 0 ? (
                    <EmptyRow colSpan={5}>No pay frequencies found.</EmptyRow>
                  ) : (
                    payFrequenciesList.map((f) => (
                      <TR key={f.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{f.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {f.slug}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{f.description || "—"}</TD>
                        <TD>
                          {f.isDefault ? (
                            <Badge variant="soft-success" className="text-[10px]">
                              Default
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TD>
                        <TD align="right">
                          <RoleGuard permission="canManageSettings">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditPayFreq(f)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeletePayFreq(f.id, f.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 5c. REQUISITION STATUSES MASTER */}
        {canViewJobStatuses && (
          <TabsContent value="job-statuses" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Manage requisition workflow lifecycle states and their visual badge styling across hiring pipelines.
              </div>
              <RoleGuard permission="canManageSettings">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setJobStatusModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Requisition Status</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Status Name</TH>
                  <TH>Slug / Code</TH>
                  <TH>Badge Styling</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {jobStatusesList.length === 0 ? (
                    <EmptyRow colSpan={5}>No requisition statuses found.</EmptyRow>
                  ) : (
                    jobStatusesList.map((s) => (
                      <TR key={s.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{s.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {s.slug}
                          </Badge>
                        </TD>
                        <TD>
                          <Badge variant={(s.badgeVariant as any) || "secondary"} className="text-[10px]">
                            {s.name}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{s.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageSettings">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditJobStatus(s)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteJobStatus(s.id, s.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 5d. INTERVIEW ROUND TYPES MASTER */}
        {canViewInterviewTypes && (
          <TabsContent value="interview-types" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Configure standard interview round templates and default durations for candidate interview scheduling.
              </div>
              <RoleGuard permission="canManageSettings">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setInterviewTypeModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Interview Round Type</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Round Type Name</TH>
                  <TH>Slug / Code</TH>
                  <TH>Default Duration</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {interviewTypesList.length === 0 ? (
                    <EmptyRow colSpan={5}>No interview round types found.</EmptyRow>
                  ) : (
                    interviewTypesList.map((t) => (
                      <TR key={t.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{t.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {t.slug}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-xs text-foreground font-medium">
                            {t.defaultDurationMinutes || 45} mins
                          </span>
                        </TD>
                        <TD className="text-muted-foreground">{t.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageSettings">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditInterviewType(t)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteInterviewType(t.id, t.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 5e. BENEFIT CATEGORIES MASTER */}
        {canViewBenefitCategories && (
          <TabsContent value="benefit-categories" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Manage company perk and benefit taxonomy categories (e.g. Healthcare, Financial, Paid Time Off, Growth).
              </div>
              <RoleGuard permission="canManageSettings">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setBenefitCatModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Benefit Category</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Category Name</TH>
                  <TH>Slug / Code</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {benefitCategoriesList.length === 0 ? (
                    <EmptyRow colSpan={4}>No benefit categories found.</EmptyRow>
                  ) : (
                    benefitCategoriesList.map((b) => (
                      <TR key={b.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{b.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {b.slug}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{b.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageSettings">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditBenefitCat(b)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteBenefitCat(b.id, b.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 6. WORK MODES */}
        {canViewWorkModes && (
          <TabsContent value="work-modes" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Define dynamic work arrangement options (e.g. Hybrid, Fully Remote, On-Site) for job requisitions.
              </div>
              <RoleGuard permission="canManageWorkModes">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setWorkModeModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Work Mode</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Work Mode</TH>
                  <TH>Slug / Code</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {workModesList.length === 0 ? (
                    <EmptyRow colSpan={4}>No work modes found.</EmptyRow>
                  ) : (
                    workModesList.map((wm) => (
                      <TR key={wm.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{wm.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {wm.slug}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{wm.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageWorkModes">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditWorkMode(wm)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteWorkMode(wm.id, wm.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 7. EMPLOYMENT TYPES */}
        {canViewEmpTypes && (
          <TabsContent value="employment-types" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Manage contract and employment classifications (e.g. Full-time Permanent, Contract, Internship) available during job creation.
              </div>
              <RoleGuard permission="canManageEmploymentTypes">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setEmpTypeModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Employment Type</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Employment Type</TH>
                  <TH>Slug / Code</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {employmentTypesList.length === 0 ? (
                    <EmptyRow colSpan={4}>No employment types found.</EmptyRow>
                  ) : (
                    employmentTypesList.map((et) => (
                      <TR key={et.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{et.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {et.slug}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{et.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageEmploymentTypes">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditEmpType(et)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteEmpType(et.id, et.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 7b. EXPERIENCE LEVELS */}
        {canViewExpLevels && (
          <TabsContent value="experience-levels" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Configure seniority tiers and minimum experience year ranges used in requisitions and candidate scorecards.
              </div>
              <RoleGuard permission="canManageExperienceLevels">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setExpLevelModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Experience Level</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Experience Level</TH>
                  <TH>Slug / Code</TH>
                  <TH>Years Range</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {experienceLevelsList.length === 0 ? (
                    <EmptyRow colSpan={5}>No experience levels found.</EmptyRow>
                  ) : (
                    experienceLevelsList.map((exp) => (
                      <TR key={exp.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{exp.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {exp.slug}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-xs text-foreground font-medium">
                            {exp.minYears} – {exp.maxYears} yrs
                          </span>
                        </TD>
                        <TD className="text-muted-foreground">{exp.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageExperienceLevels">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditExpLevel(exp)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteExpLevel(exp.id, exp.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 7c. EDUCATION REQUIREMENTS */}
        {canViewEduLevels && (
          <TabsContent value="education-levels" className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Define educational degrees and qualification classifications for job openings.
              </div>
              <RoleGuard permission="canManageEducationLevels">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setEduLevelModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Education Requirement</span>
                </Button>
              </RoleGuard>
            </div>

            <TableShell>
              <DTable>
                <THead>
                  <TH>Education Level</TH>
                  <TH>Slug / Code</TH>
                  <TH>Description</TH>
                  <TH align="right">Actions</TH>
                </THead>
                <TBody>
                  {educationLevelsList.length === 0 ? (
                    <EmptyRow colSpan={4}>No education requirements found.</EmptyRow>
                  ) : (
                    educationLevelsList.map((edu) => (
                      <TR key={edu.id}>
                        <TD>
                          <span className="font-semibold text-xs text-foreground">{edu.name}</span>
                        </TD>
                        <TD mono>
                          <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                            {edu.slug}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{edu.description || "—"}</TD>
                        <TD align="right">
                          <RoleGuard permission="canManageEducationLevels">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditEduLevel(edu)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteEduLevel(edu.id, edu.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </RoleGuard>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </DTable>
            </TableShell>
          </TabsContent>
        )}

        {/* 8. INTEGRATIONS / MICROFRONTEND */}
        {canViewSDK && (
          <TabsContent value="integrations" className="space-y-4 w-full max-w-full min-w-0">
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Microfrontend Architecture SDK</CardTitle>
                    <CardDescription className="text-xs">
                      Embed ReqruitBook ATS modules directly inside My Organisation HRM
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={copyToClipboard}
                    className="gap-1 text-xs"
                  >
                    {copied ? <CheckCircle2 className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    <span>{copied ? "Copied" : "Copy Code"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="p-3 bg-muted/60 rounded-xs border border-border text-[11px] text-foreground overflow-x-auto">
                  {embedCodeSnippet}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* CREATE CUSTOM ROLE MODAL */}
      <Dialog open={createRoleModalOpen} onOpenChange={setCreateRoleModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-copper" />
              <span>Create Custom Dynamic Role</span>
            </DialogTitle>
            <div className="text-xs text-muted-foreground">
              Define a new role and choose granular system permissions.
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="field-label">Role Title *</label>
                <Input
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    if (!roleSlug) {
                      setRoleSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "_")
                          .replace(/^_+|_+$/g, ""),
                      );
                    }
                  }}
                  placeholder="e.g. Lead Technical Recruiter"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="field-label">Role Identifier Slug</label>
                <Input
                  value={roleSlug}
                  onChange={(e) => setRoleSlug(e.target.value)}
                  placeholder="e.g. lead_tech_recruiter"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="field-label">Role Description</label>
                <Textarea
                  rows={2}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Responsibilities and access scope for this role..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="field-label">Badge Label</label>
                <Input
                  value={roleBadge}
                  onChange={(e) => setRoleBadge(e.target.value)}
                  placeholder="e.g. Recruiter Lead"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Permissions Checkbox Matrix Grouped by Category */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">
                  Grant System Permissions ({rolePerms.size} selected)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setRolePerms(new Set(ALL_PERMISSIONS.map((p) => p.key)))}
                    className="h-6 text-[11px] text-copper"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setRolePerms(new Set())}
                    className="h-6 text-[11px] text-muted-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {PERMISSION_CATEGORIES.map((cat) => {
                  const catPerms = ALL_PERMISSIONS.filter((p) => p.category === cat.id);
                  return (
                    <div key={cat.id} className="p-3 bg-muted/30 rounded-xs border border-border space-y-2">
                      <div className="font-semibold text-[11px] uppercase tracking-wider text-copper">
                        {cat.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catPerms.map((p) => {
                          const checked = rolePerms.has(p.key);
                          return (
                            <label
                              key={p.key}
                              className="flex items-start gap-2 p-1.5 rounded-xs hover:bg-muted/50 cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = new Set(rolePerms);
                                  if (e.target.checked) next.add(p.key);
                                  else next.delete(p.key);
                                  setRolePerms(next);
                                }}
                                className="mt-0.5 size-3.5 rounded-xs accent-copper cursor-pointer"
                              />
                              <div>
                                <span className="font-medium text-foreground block text-[11px] leading-tight">
                                  {p.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-tight block">
                                  {p.description}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setCreateRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingRole}
              onClick={handleCreateRole}
              className="gap-1"
            >
              {isCreatingRole ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
              <span>Save &amp; Create Role</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ROLE & PERMISSIONS MODAL */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Edit2 className="size-4 text-copper" />
              <span>Edit Role &amp; Permissions: {editingRole?.name}</span>
            </DialogTitle>
            <div className="text-xs text-muted-foreground">
              Update role attributes and toggle active permissions in database.
            </div>
          </DialogHeader>

          {editingRole && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="field-label">Role Title</label>
                  <Input
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="field-label">Badge Label</label>
                  <Input
                    value={editRoleBadge}
                    onChange={(e) => setEditRoleBadge(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="field-label">Role Description</label>
                  <Textarea
                    rows={2}
                    value={editRoleDesc}
                    onChange={(e) => setEditRoleDesc(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Permissions Checkbox Matrix */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">
                    Assigned Permissions ({editRolePerms.size} selected)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditRolePerms(new Set(ALL_PERMISSIONS.map((p) => p.key)))}
                      className="h-6 text-[11px] text-copper"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditRolePerms(new Set())}
                      className="h-6 text-[11px] text-muted-foreground"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const catPerms = ALL_PERMISSIONS.filter((p) => p.category === cat.id);
                    return (
                      <div key={cat.id} className="p-3 bg-muted/30 rounded-xs border border-border space-y-2">
                        <div className="font-semibold text-[11px] uppercase tracking-wider text-copper">
                          {cat.name}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catPerms.map((p) => {
                            const checked = editRolePerms.has(p.key);
                            return (
                              <label
                                key={p.key}
                                className="flex items-start gap-2 p-1.5 rounded-xs hover:bg-muted/50 cursor-pointer text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = new Set(editRolePerms);
                                    if (e.target.checked) next.add(p.key);
                                    else next.delete(p.key);
                                    setEditRolePerms(next);
                                  }}
                                  className="mt-0.5 size-3.5 rounded-xs accent-copper cursor-pointer"
                                />
                                <div>
                                  <span className="font-medium text-foreground block text-[11px] leading-tight">
                                    {p.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground leading-tight block">
                                    {p.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingRole}
              onClick={handleSaveEditRole}
              className="gap-1"
            >
              {isUpdatingRole ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Role Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add New User Account</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Full Name *</label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="field-label">Email Address *</label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="field-label">Temporary Password *</label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="field-label">Dynamic RBAC Role *</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-xs border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-copper"
              >
                {rolesList.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name} {r.slug === "system_admin" ? "(Root Admin)" : r.isSystem ? "(System)" : "(Custom)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingUser}
              onClick={handleCreateUser}
              className="gap-1"
            >
              {isCreatingUser ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Create Account</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Department Modal */}
      <Dialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Department</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Department Name</label>
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Data Science & AI"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Department Code</label>
              <Input
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                placeholder="e.g. DSAI"
                className="h-8 text-xs uppercase"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingDept}
              onClick={handleCreateDept}
              className="gap-1"
            >
              {isCreatingDept ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Add Department</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Location Modal */}
      <Dialog open={locModalOpen} onOpenChange={setLocModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Office Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Location Title</label>
              <Input
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="e.g. Seattle Innovation Hub"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">City</label>
              <Input
                value={newLocCity}
                onChange={(e) => setNewLocCity(e.target.value)}
                placeholder="e.g. Seattle, WA"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Country</label>
              <Input
                value={newLocCountry}
                onChange={(e) => setNewLocCountry(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setLocModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingLoc}
              onClick={handleCreateLoc}
              className="gap-1"
            >
              {isCreatingLoc ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Add Location</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Work Mode Modal */}
      <Dialog open={workModeModalOpen} onOpenChange={setWorkModeModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Work Mode</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Work Mode Name *</label>
              <Input
                value={newWorkModeName}
                onChange={(e) => {
                  setNewWorkModeName(e.target.value);
                  if (!newWorkModeSlug) {
                    setNewWorkModeSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Hybrid (3 Days Office)"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newWorkModeSlug}
                onChange={(e) => setNewWorkModeSlug(e.target.value)}
                placeholder="e.g. hybrid_3days"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newWorkModeDesc}
                onChange={(e) => setNewWorkModeDesc(e.target.value)}
                placeholder="e.g. Tuesday-Thursday in office, Monday/Friday remote"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setWorkModeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingWorkMode}
              onClick={handleCreateWorkMode}
              className="gap-1"
            >
              {isCreatingWorkMode ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Add Work Mode</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employment Type Modal */}
      <Dialog open={empTypeModalOpen} onOpenChange={setEmpTypeModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Employment Type</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Employment Type Name *</label>
              <Input
                value={newEmpTypeName}
                onChange={(e) => {
                  setNewEmpTypeName(e.target.value);
                  if (!newEmpTypeSlug) {
                    setNewEmpTypeSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Fixed-Term Contract (12 Mo)"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newEmpTypeSlug}
                onChange={(e) => setNewEmpTypeSlug(e.target.value)}
                placeholder="e.g. contract_12mo"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newEmpTypeDesc}
                onChange={(e) => setNewEmpTypeDesc(e.target.value)}
                placeholder="e.g. 12-month fixed term with renewal evaluation"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEmpTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingEmpType}
              onClick={handleCreateEmpType}
              className="gap-1"
            >
              {isCreatingEmpType ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Add Employment Type</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Department</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Department Name *</label>
              <Input
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                placeholder="e.g. Engineering"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Code / Abbreviation *</label>
              <Input
                value={editDeptCode}
                onChange={(e) => setEditDeptCode(e.target.value.toUpperCase())}
                placeholder="e.g. ENG"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingDept(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingDept}
              onClick={handleSaveEditDept}
              className="gap-1"
            >
              {isUpdatingDept ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={!!editingLoc} onOpenChange={(open) => !open && setEditingLoc(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Office Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Location Name / Hub *</label>
              <Input
                value={editLocName}
                onChange={(e) => setEditLocName(e.target.value)}
                placeholder="e.g. London EMEA Office"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">City *</label>
              <Input
                value={editLocCity}
                onChange={(e) => setEditLocCity(e.target.value)}
                placeholder="e.g. London"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Country *</label>
              <Input
                value={editLocCountry}
                onChange={(e) => setEditLocCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingLoc(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingLoc}
              onClick={handleSaveEditLoc}
              className="gap-1"
            >
              {isUpdatingLoc ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Work Mode Modal */}
      <Dialog open={!!editingWorkMode} onOpenChange={(open) => !open && setEditingWorkMode(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Work Mode</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Work Mode Name *</label>
              <Input
                value={editWorkModeName}
                onChange={(e) => setEditWorkModeName(e.target.value)}
                placeholder="e.g. Hybrid (3 Days Office)"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editWorkModeSlug}
                onChange={(e) => setEditWorkModeSlug(e.target.value)}
                placeholder="e.g. hybrid_3days"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editWorkModeDesc}
                onChange={(e) => setEditWorkModeDesc(e.target.value)}
                placeholder="e.g. Tuesday-Thursday in office"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingWorkMode(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingWorkMode}
              onClick={handleSaveEditWorkMode}
              className="gap-1"
            >
              {isUpdatingWorkMode ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employment Type Modal */}
      <Dialog open={!!editingEmpType} onOpenChange={(open) => !open && setEditingEmpType(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Employment Type</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Employment Type Name *</label>
              <Input
                value={editEmpTypeName}
                onChange={(e) => setEditEmpTypeName(e.target.value)}
                placeholder="e.g. Fixed-Term Contract"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editEmpTypeSlug}
                onChange={(e) => setEditEmpTypeSlug(e.target.value)}
                placeholder="e.g. contract_12mo"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editEmpTypeDesc}
                onChange={(e) => setEditEmpTypeDesc(e.target.value)}
                placeholder="e.g. 12-month fixed term"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingEmpType(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingEmpType}
              onClick={handleSaveEditEmpType}
              className="gap-1"
            >
              {isUpdatingEmpType ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD EXPERIENCE LEVEL MODAL */}
      <Dialog open={expLevelModalOpen} onOpenChange={setExpLevelModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Experience Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Experience Level Name *</label>
              <Input
                value={newExpLevelName}
                onChange={(e) => {
                  setNewExpLevelName(e.target.value);
                  if (!newExpLevelSlug) {
                    setNewExpLevelSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Senior Staff Engineer"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newExpLevelSlug}
                onChange={(e) => setNewExpLevelSlug(e.target.value)}
                placeholder="e.g. senior_staff"
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="field-label">Min Experience (Yrs)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={newExpLevelMinYears}
                  onChange={(e) => setNewExpLevelMinYears(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="field-label">Max Experience (Yrs)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={newExpLevelMaxYears}
                  onChange={(e) => setNewExpLevelMaxYears(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newExpLevelDesc}
                onChange={(e) => setNewExpLevelDesc(e.target.value)}
                placeholder="e.g. Principal organizational leadership"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setExpLevelModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingExpLevel}
              onClick={handleCreateExpLevel}
              className="gap-1"
            >
              {isCreatingExpLevel ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT EXPERIENCE LEVEL MODAL */}
      <Dialog open={!!editingExpLevel} onOpenChange={(open) => !open && setEditingExpLevel(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Experience Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Experience Level Name *</label>
              <Input
                value={editExpLevelName}
                onChange={(e) => setEditExpLevelName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editExpLevelSlug}
                onChange={(e) => setEditExpLevelSlug(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="field-label">Min Experience (Yrs)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={editExpLevelMinYears}
                  onChange={(e) => setEditExpLevelMinYears(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="field-label">Max Experience (Yrs)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={editExpLevelMaxYears}
                  onChange={(e) => setEditExpLevelMaxYears(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editExpLevelDesc}
                onChange={(e) => setEditExpLevelDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingExpLevel(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingExpLevel}
              onClick={handleSaveEditExpLevel}
              className="gap-1"
            >
              {isUpdatingExpLevel ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD EDUCATION LEVEL MODAL */}
      <Dialog open={eduLevelModalOpen} onOpenChange={setEduLevelModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Education Requirement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Education Requirement Name *</label>
              <Input
                value={newEduLevelName}
                onChange={(e) => {
                  setNewEduLevelName(e.target.value);
                  if (!newEduLevelSlug) {
                    setNewEduLevelSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Associate Degree"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newEduLevelSlug}
                onChange={(e) => setNewEduLevelSlug(e.target.value)}
                placeholder="e.g. associate_degree"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newEduLevelDesc}
                onChange={(e) => setNewEduLevelDesc(e.target.value)}
                placeholder="e.g. 2-year postsecondary degree"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEduLevelModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingEduLevel}
              onClick={handleCreateEduLevel}
              className="gap-1"
            >
              {isCreatingEduLevel ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT EDUCATION LEVEL MODAL */}
      <Dialog open={!!editingEduLevel} onOpenChange={(open) => !open && setEditingEduLevel(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Education Requirement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Education Requirement Name *</label>
              <Input
                value={editEduLevelName}
                onChange={(e) => setEditEduLevelName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editEduLevelSlug}
                onChange={(e) => setEditEduLevelSlug(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editEduLevelDesc}
                onChange={(e) => setEditEduLevelDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingEduLevel(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingEduLevel}
              onClick={handleSaveEditEduLevel}
              className="gap-1"
            >
              {isUpdatingEduLevel ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------------------- */}
      {/* 1. ADD CURRENCY MODAL */}
      {/* --------------------------------------------------------------------- */}
      <Dialog open={currencyModalOpen} onOpenChange={setCurrencyModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Currency Master</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="field-label">Currency Code *</label>
                <Input
                  value={newCurrCode}
                  onChange={(e) => {
                    setNewCurrCode(e.target.value);
                    if (!newCurrName) setNewCurrName(`${e.target.value.toUpperCase()} (${newCurrSymbol || "$"})`);
                  }}
                  placeholder="e.g. JPY"
                  className="h-8 text-xs uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="field-label">Symbol *</label>
                <Input
                  value={newCurrSymbol}
                  onChange={(e) => {
                    setNewCurrSymbol(e.target.value);
                    if (newCurrCode) setNewCurrName(`${newCurrCode.toUpperCase()} (${e.target.value})`);
                  }}
                  placeholder="e.g. ¥"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="field-label">Display Name *</label>
              <Input
                value={newCurrName}
                onChange={(e) => setNewCurrName(e.target.value)}
                placeholder="e.g. Japanese Yen (¥)"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="newCurrDefaultCheck"
                checked={newCurrDefault}
                onChange={(e) => setNewCurrDefault(e.target.checked)}
                className="rounded text-copper focus:ring-copper"
              />
              <label htmlFor="newCurrDefaultCheck" className="text-xs text-foreground cursor-pointer">
                Set as Default Base Currency
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setCurrencyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingCurrency}
              onClick={handleCreateCurrency}
              className="gap-1"
            >
              {isCreatingCurrency ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT CURRENCY MODAL */}
      <Dialog open={!!editingCurrency} onOpenChange={(open) => !open && setEditingCurrency(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Currency Master</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="field-label">Currency Code *</label>
                <Input
                  value={editCurrCode}
                  onChange={(e) => setEditCurrCode(e.target.value)}
                  placeholder="e.g. USD"
                  className="h-8 text-xs uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="field-label">Symbol *</label>
                <Input
                  value={editCurrSymbol}
                  onChange={(e) => setEditCurrSymbol(e.target.value)}
                  placeholder="e.g. $"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="field-label">Display Name *</label>
              <Input
                value={editCurrName}
                onChange={(e) => setEditCurrName(e.target.value)}
                placeholder="e.g. US Dollar ($)"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editCurrDefaultCheck"
                checked={editCurrDefault}
                onChange={(e) => setEditCurrDefault(e.target.checked)}
                className="rounded text-copper focus:ring-copper"
              />
              <label htmlFor="editCurrDefaultCheck" className="text-xs text-foreground cursor-pointer">
                Set as Default Base Currency
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingCurrency(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingCurrency}
              onClick={handleSaveEditCurrency}
              className="gap-1"
            >
              {isUpdatingCurrency ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------------------- */}
      {/* 2. ADD PAY FREQUENCY MODAL */}
      {/* --------------------------------------------------------------------- */}
      <Dialog open={payFreqModalOpen} onOpenChange={setPayFreqModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Pay Frequency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Frequency Name *</label>
              <Input
                value={newPayFreqName}
                onChange={(e) => {
                  setNewPayFreqName(e.target.value);
                  if (!newPayFreqSlug) {
                    setNewPayFreqSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Bi-Weekly Pay"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newPayFreqSlug}
                onChange={(e) => setNewPayFreqSlug(e.target.value)}
                placeholder="e.g. bi_weekly"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newPayFreqDesc}
                onChange={(e) => setNewPayFreqDesc(e.target.value)}
                placeholder="e.g. Disbursed 26 times per year"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="newPayFreqDefaultCheck"
                checked={newPayFreqDefault}
                onChange={(e) => setNewPayFreqDefault(e.target.checked)}
                className="rounded text-copper focus:ring-copper"
              />
              <label htmlFor="newPayFreqDefaultCheck" className="text-xs text-foreground cursor-pointer">
                Set as Default Frequency
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setPayFreqModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingPayFreq}
              onClick={handleCreatePayFreq}
              className="gap-1"
            >
              {isCreatingPayFreq ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PAY FREQUENCY MODAL */}
      <Dialog open={!!editingPayFreq} onOpenChange={(open) => !open && setEditingPayFreq(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Pay Frequency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Frequency Name *</label>
              <Input
                value={editPayFreqName}
                onChange={(e) => setEditPayFreqName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editPayFreqSlug}
                onChange={(e) => setEditPayFreqSlug(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editPayFreqDesc}
                onChange={(e) => setEditPayFreqDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editPayFreqDefaultCheck"
                checked={editPayFreqDefault}
                onChange={(e) => setEditPayFreqDefault(e.target.checked)}
                className="rounded text-copper focus:ring-copper"
              />
              <label htmlFor="editPayFreqDefaultCheck" className="text-xs text-foreground cursor-pointer">
                Set as Default Frequency
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingPayFreq(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingPayFreq}
              onClick={handleSaveEditPayFreq}
              className="gap-1"
            >
              {isUpdatingPayFreq ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------------------- */}
      {/* 3. ADD REQUISITION STATUS MODAL */}
      {/* --------------------------------------------------------------------- */}
      <Dialog open={jobStatusModalOpen} onOpenChange={setJobStatusModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Requisition Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Status Name *</label>
              <Input
                value={newStatusName}
                onChange={(e) => {
                  setNewStatusName(e.target.value);
                  if (!newStatusSlug) {
                    setNewStatusSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Sourcing Phase"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newStatusSlug}
                onChange={(e) => setNewStatusSlug(e.target.value)}
                placeholder="e.g. sourcing"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Badge Color Variant</label>
              <select
                value={newStatusBadge}
                onChange={(e) => setNewStatusBadge(e.target.value)}
                className="h-8 w-full rounded-xs border border-border bg-card px-2 text-xs text-foreground"
              >
                <option value="soft-success">Green (Active / Open / Live)</option>
                <option value="secondary">Gray (Draft / Preparation)</option>
                <option value="warning">Amber (On Hold / Paused)</option>
                <option value="destructive">Red (Closed / Cancelled)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newStatusDesc}
                onChange={(e) => setNewStatusDesc(e.target.value)}
                placeholder="e.g. Active outbound candidate search"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setJobStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingJobStatus}
              onClick={handleCreateJobStatus}
              className="gap-1"
            >
              {isCreatingJobStatus ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT REQUISITION STATUS MODAL */}
      <Dialog open={!!editingJobStatus} onOpenChange={(open) => !open && setEditingJobStatus(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Requisition Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Status Name *</label>
              <Input
                value={editStatusName}
                onChange={(e) => setEditStatusName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editStatusSlug}
                onChange={(e) => setEditStatusSlug(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Badge Color Variant</label>
              <select
                value={editStatusBadge}
                onChange={(e) => setEditStatusBadge(e.target.value)}
                className="h-8 w-full rounded-xs border border-border bg-card px-2 text-xs text-foreground"
              >
                <option value="soft-success">Green (Active / Open / Live)</option>
                <option value="secondary">Gray (Draft / Preparation)</option>
                <option value="warning">Amber (On Hold / Paused)</option>
                <option value="destructive">Red (Closed / Cancelled)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editStatusDesc}
                onChange={(e) => setEditStatusDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingJobStatus(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingJobStatus}
              onClick={handleSaveEditJobStatus}
              className="gap-1"
            >
              {isUpdatingJobStatus ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------------------- */}
      {/* 4. ADD INTERVIEW TYPE MODAL */}
      {/* --------------------------------------------------------------------- */}
      <Dialog open={interviewTypeModalOpen} onOpenChange={setInterviewTypeModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Interview Round Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Round Type Name *</label>
              <Input
                value={newITypeName}
                onChange={(e) => {
                  setNewITypeName(e.target.value);
                  if (!newITypeSlug) {
                    setNewITypeSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Executive Leadership"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newITypeSlug}
                onChange={(e) => setNewITypeSlug(e.target.value)}
                placeholder="e.g. executive"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Default Duration (Minutes)</label>
              <select
                value={newITypeDuration}
                onChange={(e) => setNewITypeDuration(Number(e.target.value))}
                className="h-8 w-full rounded-xs border border-border bg-card px-2 text-xs text-foreground"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newITypeDesc}
                onChange={(e) => setNewITypeDesc(e.target.value)}
                placeholder="e.g. Core values, cultural alignment and final review"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setInterviewTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingInterviewType}
              onClick={handleCreateInterviewType}
              className="gap-1"
            >
              {isCreatingInterviewType ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT INTERVIEW TYPE MODAL */}
      <Dialog open={!!editingInterviewType} onOpenChange={(open) => !open && setEditingInterviewType(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Interview Round Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Round Type Name *</label>
              <Input
                value={editITypeName}
                onChange={(e) => setEditITypeName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editITypeSlug}
                onChange={(e) => setEditITypeSlug(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Default Duration (Minutes)</label>
              <select
                value={editITypeDuration}
                onChange={(e) => setEditITypeDuration(Number(e.target.value))}
                className="h-8 w-full rounded-xs border border-border bg-card px-2 text-xs text-foreground"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editITypeDesc}
                onChange={(e) => setEditITypeDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingInterviewType(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingInterviewType}
              onClick={handleSaveEditInterviewType}
              className="gap-1"
            >
              {isUpdatingInterviewType ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------------------- */}
      {/* 5. ADD BENEFIT CATEGORY MODAL */}
      {/* --------------------------------------------------------------------- */}
      <Dialog open={benefitCatModalOpen} onOpenChange={setBenefitCatModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Benefit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Category Name *</label>
              <Input
                value={newBCatName}
                onChange={(e) => {
                  setNewBCatName(e.target.value);
                  if (!newBCatSlug) {
                    setNewBCatSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Parental Support"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={newBCatSlug}
                onChange={(e) => setNewBCatSlug(e.target.value)}
                placeholder="e.g. parental"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={newBCatDesc}
                onChange={(e) => setNewBCatDesc(e.target.value)}
                placeholder="e.g. Family planning, childcare subsidies and leave"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setBenefitCatModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isCreatingBenefitCat}
              onClick={handleCreateBenefitCat}
              className="gap-1"
            >
              {isCreatingBenefitCat ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save &amp; Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT BENEFIT CATEGORY MODAL */}
      <Dialog open={!!editingBenefitCat} onOpenChange={(open) => !open && setEditingBenefitCat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Benefit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="field-label">Category Name *</label>
              <Input
                value={editBCatName}
                onChange={(e) => setEditBCatName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Identifier Slug</label>
              <Input
                value={editBCatSlug}
                onChange={(e) => setEditBCatSlug(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="field-label">Description</label>
              <Input
                value={editBCatDesc}
                onChange={(e) => setEditBCatDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setEditingBenefitCat(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="accent"
              disabled={isUpdatingBenefitCat}
              onClick={handleSaveEditBenefitCat}
              className="gap-1"
            >
              {isUpdatingBenefitCat ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="page p-8 text-xs text-muted-foreground">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
