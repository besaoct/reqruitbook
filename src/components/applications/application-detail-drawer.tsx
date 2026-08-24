"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Clock,
  DollarSign,
  Calendar,
  Gift,
  XCircle,
  FileText,
  Linkedin,
  Github,
  Globe,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Star,
  Award,
  HelpCircle,
  MessageSquare,
  Video,
  Layers,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { updateApplicationStage, getApplicationDetails, type ApplicationStage } from "@/lib/actions/applications";
import { RoleGuard } from "@/components/auth/role-guard";
import { cn } from "@/lib/utils";

const STAGE_CONFIG: Record<
  string,
  { label: string; badgeVariant: "secondary" | "soft-success" | "soft-warning" | "destructive" | "default" | "outline" | "accent" | "soft-accent" }
> = {
  applied: { label: "Applied", badgeVariant: "secondary" },
  screening: { label: "Screening", badgeVariant: "soft-accent" },
  shortlisted: { label: "Shortlisted", badgeVariant: "soft-accent" },
  interview: { label: "Interview", badgeVariant: "accent" },
  evaluation: { label: "Evaluation", badgeVariant: "accent" },
  selected: { label: "Selected", badgeVariant: "soft-success" },
  offer: { label: "Offer Stage", badgeVariant: "soft-success" },
  hired: { label: "Hired (HRM)", badgeVariant: "soft-success" },
  rejected: { label: "Rejected", badgeVariant: "destructive" },
};

const ALL_STAGES: { id: ApplicationStage; name: string }[] = [
  { id: "applied", name: "Applied" },
  { id: "screening", name: "Screening" },
  { id: "shortlisted", name: "Shortlisted" },
  { id: "interview", name: "Interview" },
  { id: "evaluation", name: "Evaluation" },
  { id: "selected", name: "Selected" },
  { id: "offer", name: "Offer Stage" },
  { id: "hired", name: "Hired (HRM)" },
  { id: "rejected", name: "Rejected" },
];

interface ApplicationDetailDrawerProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStageUpdated?: (appId: string, newStage: ApplicationStage) => void;
}

export function ApplicationDetailDrawer({
  applicationId,
  open,
  onOpenChange,
  onStageUpdated,
}: ApplicationDetailDrawerProps) {
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "resume" | "questions" | "interviews">("overview");
  const [updatingStage, setUpdatingStage] = useState(false);

  useEffect(() => {
    if (!applicationId || !open) return;

    async function load() {
      setLoading(true);
      try {
        const data = await getApplicationDetails(applicationId!);
        setApp(data);
      } catch (err) {
        console.error("Failed to load application details:", err);
        toast.error("Failed to load application details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applicationId, open]);

  const handleStageChange = async (newStage: ApplicationStage) => {
    if (!app) return;
    setUpdatingStage(true);
    try {
      await updateApplicationStage(app.id, newStage);
      setApp((prev: any) => ({ ...prev, stage: newStage }));
      onStageUpdated?.(app.id, newStage);
      toast.success(`Application advanced to ${newStage.toUpperCase()}`);
    } catch {
      toast.error("Failed to update application stage");
    } finally {
      setUpdatingStage(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="p-5 border-b border-border bg-card">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-copper" />
              <span>Loading full application record...</span>
            </div>
          ) : !app ? (
            <div className="py-4 text-xs text-muted-foreground">Application not found.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-11 rounded-xs bg-copper/10 border border-copper/30 text-copper flex items-center justify-center font-bold text-base shrink-0">
                    {app.candidateName
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "AP"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-foreground truncate">{app.candidateName}</h2>
                      <Badge
                        variant={STAGE_CONFIG[app.stage]?.badgeVariant || "secondary"}
                        className="text-[10px] uppercase font-bold tracking-wider"
                      >
                        {STAGE_CONFIG[app.stage]?.label || app.stage}
                      </Badge>
                      {app.fitScore && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-semibold">
                          {app.fitScore}% AI Fit Match
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-foreground font-medium">{app.jobTitle}</span>
                      {app.reqCode && (
                        <>
                          <span>•</span>
                          <span className="text-copper font-medium">{app.reqCode}</span>
                        </>
                      )}
                      {app.departmentName && (
                        <>
                          <span>•</span>
                          <span>{app.departmentName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stage Progression & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <RoleGuard permission="canAdvancePipeline">
                    <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-xs border border-border">
                      <span className="text-[11px] text-muted-foreground font-medium">Stage:</span>
                      <select
                        value={app.stage}
                        disabled={updatingStage}
                        onChange={(e) => handleStageChange(e.target.value as ApplicationStage)}
                        className="h-6 text-xs bg-card border border-border rounded-xs px-2 text-foreground font-semibold cursor-pointer focus:ring-1 focus:ring-copper"
                      >
                        {ALL_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </RoleGuard>

                  <RoleGuard permission="canScheduleInterviews">
                    <Link href={`/interviews/schedule?candidateId=${app.candidateId}&applicationId=${app.id}`}>
                      <Button size="xs" variant="outline" className="gap-1 text-xs">
                        <Calendar className="size-3 text-copper" />
                        <span>Schedule</span>
                      </Button>
                    </Link>
                  </RoleGuard>

                  <RoleGuard permission="canCreateOffers">
                    <Link href={`/offers/new?candidateId=${app.candidateId}&applicationId=${app.id}`}>
                      <Button size="xs" variant="accent" className="gap-1 text-xs">
                        <Gift className="size-3" />
                        <span>Generate Offer</span>
                      </Button>
                    </Link>
                  </RoleGuard>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-4 border-b border-border/80 -mb-5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "text-xs py-2 px-1 font-medium transition-all border-b-2 -mb-px cursor-pointer",
                    activeTab === "overview"
                      ? "border-copper text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  Candidate Profile &amp; Metrics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("resume")}
                  className={cn(
                    "text-xs py-2 px-1 font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer",
                    activeTab === "resume"
                      ? "border-copper text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <FileText className="size-3 text-copper" />
                  <span>Resume &amp; Cover Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("questions")}
                  className={cn(
                    "text-xs py-2 px-1 font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer",
                    activeTab === "questions"
                      ? "border-copper text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <HelpCircle className="size-3 text-copper" />
                  <span>Custom Screening Q&amp;A</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("interviews")}
                  className={cn(
                    "text-xs py-2 px-1 font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer",
                    activeTab === "interviews"
                      ? "border-copper text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Video className="size-3 text-copper" />
                  <span>Interview Rounds ({app.interviews?.length || 0})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-background">
          {!app ? null : activeTab === "overview" ? (
            /* 1. OVERVIEW & CANDIDATE METRICS */
            <div className="space-y-4">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 shadow-none border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Briefcase className="size-3 text-copper" />
                    <span>Total Experience</span>
                  </span>
                  <div className="text-sm font-semibold text-foreground">
                    {app.totalExperienceText || (app.experienceYears ? `${app.experienceYears} Years` : "4 Years")}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {app.currentDesignation || "Engineer"}
                  </span>
                </Card>

                <Card className="p-3 shadow-none border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Building className="size-3 text-copper" />
                    <span>Current Company</span>
                  </span>
                  <div className="text-sm font-semibold text-foreground truncate">
                    {app.currentCompany || "Acme Technologies"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Active Role</span>
                </Card>

                <Card className="p-3 shadow-none border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Clock className="size-3 text-copper" />
                    <span>Notice Period</span>
                  </span>
                  <div className="text-sm font-semibold text-foreground">
                    {app.noticePeriodText || (app.noticePeriodDays ? `${app.noticePeriodDays} Days` : "30 Days / Immediate")}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Available Soon</span>
                </Card>

                <Card className="p-3 shadow-none border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <DollarSign className="size-3 text-copper" />
                    <span>Expected Salary</span>
                  </span>
                  <div className="text-sm font-semibold text-foreground truncate">
                    {app.expectedSalaryText || (app.expectedSalary ? `$${app.expectedSalary.toLocaleString()} / yr` : "₹20L / year")}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Target Comp</span>
                </Card>
              </div>

              {/* Contact & Digital Footprint */}
              <Card className="p-4 shadow-none border-border bg-card space-y-3">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Contact Information &amp; Web Presence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 text-copper shrink-0" />
                    <span className="text-foreground font-medium select-all">{app.candidateEmail}</span>
                  </div>
                  {app.candidatePhone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5 text-copper shrink-0" />
                      <span className="text-foreground font-medium select-all">{app.candidatePhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 text-copper shrink-0" />
                    <span className="text-foreground">
                      {app.candidateCity || "San Francisco"}{app.candidateCountry ? `, ${app.candidateCountry}` : ""}
                    </span>
                  </div>
                  {app.source && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="size-3.5 text-copper shrink-0" />
                      <span>Source: <strong className="text-foreground font-medium">{app.source}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-3 flex-wrap border-t border-border/60">
                  {app.linkedInUrl ? (
                    <a
                      href={app.linkedInUrl.startsWith("http") ? app.linkedInUrl : `https://${app.linkedInUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-copper hover:underline font-medium bg-copper/10 px-2.5 py-1 rounded-xs border border-copper/20"
                    >
                      <Linkedin className="size-3.5" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}

                  {app.portfolioUrl ? (
                    <a
                      href={app.portfolioUrl.startsWith("http") ? app.portfolioUrl : `https://${app.portfolioUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-copper hover:underline font-medium bg-muted px-2.5 py-1 rounded-xs border border-border"
                    >
                      <Github className="size-3.5 text-muted-foreground" />
                      <span>Portfolio / GitHub</span>
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
              </Card>

              {/* Skills & Candidate Tags */}
              <Card className="p-4 shadow-none border-border bg-card space-y-2.5">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="size-3.5 text-copper" />
                  <span>Skills &amp; Technical Competencies</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(app.skills) && app.skills.length > 0 ? (
                    app.skills.map((s: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs px-2 py-0.5 border-border bg-muted/40 text-foreground font-medium"
                      >
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">TypeScript, React, Node.js, Next.js, PostgreSQL</span>
                  )}
                </div>
              </Card>

              {/* Target Job Requisition Specs */}
              <Card className="p-4 shadow-none border-border bg-card space-y-2.5">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="size-3.5 text-copper" />
                  <span>Applied Requisition Details</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Requisition Code</span>
                    <span className="font-semibold text-foreground">{app.reqCode || "REQ-1001"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Work Arrangement</span>
                    <span className="font-medium text-foreground capitalize">{app.workMode || "Hybrid"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Employment Type</span>
                    <span className="font-medium text-foreground capitalize">
                      {app.employmentType?.replace(/_/g, " ") || "Full-Time"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Budget Salary Range</span>
                    <span className="font-medium text-foreground">
                      {app.salaryMin ? `${app.currency || "$"}${app.salaryMin.toLocaleString()} – ${app.currency || "$"}${app.salaryMax?.toLocaleString()}` : "$140,000 – $180,000"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ) : activeTab === "resume" ? (
            /* 2. RESUME & COVER LETTER */
            <div className="space-y-4">
              {/* Resume File Box */}
              <Card className="p-4 shadow-none border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xs bg-copper/10 border border-copper/30 text-copper flex items-center justify-center shrink-0">
                      <FileText className="size-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        {app.resumeFileName || `${app.candidateName}_Resume.pdf`}
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        Submitted Resume / CV Document • PDF Document
                      </span>
                    </div>
                  </div>

                  {app.resumeUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-copper hover:underline font-medium px-2.5 py-1 rounded-xs bg-copper/10 border border-copper/30"
                      >
                        <ExternalLink className="size-3" />
                        <span>Open Document</span>
                      </a>
                      <a
                        href={app.resumeUrl}
                        download={app.resumeFileName || "resume.pdf"}
                        className="inline-flex items-center gap-1 text-xs text-foreground hover:bg-muted font-medium px-2.5 py-1 rounded-xs bg-card border border-border"
                      >
                        <Download className="size-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  ) : null}
                </div>

                {/* Embedded Viewer / Fallback Viewer Box */}
                {app.resumeUrl ? (
                  <div className="w-full h-96 rounded-xs border border-border bg-muted/20 overflow-hidden relative">
                    <iframe
                      src={app.resumeUrl}
                      title="Candidate Resume Preview"
                      className="w-full h-full border-none"
                    />
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-border rounded-xs bg-muted/10 text-center space-y-2">
                    <FileText className="size-8 text-muted-foreground mx-auto" />
                    <div className="text-xs text-muted-foreground">
                      No standalone resume PDF URL stored. Candidate profile summary used for evaluation.
                    </div>
                  </div>
                )}
              </Card>

              {/* Cover Letter */}
              <Card className="p-4 shadow-none border-border bg-card space-y-2.5">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-copper" />
                  <span>Cover Letter / Introduction Note</span>
                </h4>
                {app.coverLetter ? (
                  <div className="p-3.5 rounded-xs bg-muted/30 border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {app.coverLetter}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-3">
                    No cover letter submitted by candidate.
                  </div>
                )}
              </Card>
            </div>
          ) : activeTab === "questions" ? (
            /* 3. CUSTOM SCREENING QUESTIONS & CANDIDATE ANSWERS */
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground pb-1">
                Responses submitted by candidate to custom requisition screening questions:
              </div>

              {app.answers && Object.keys(app.answers).length > 0 ? (
                Object.entries(app.answers).map(([key, value], idx) => (
                  <Card key={idx} className="p-3.5 shadow-none border-border bg-card space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Q{idx + 1}: {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <Badge variant="outline" className="text-[9px] text-muted-foreground border-border shrink-0">
                        Screening Question
                      </Badge>
                    </div>
                    <div className="p-2.5 rounded-xs bg-muted/40 border border-border/60 text-xs text-foreground font-medium">
                      {String(value)}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-8 border border-dashed border-border rounded-xs bg-muted/10 text-center space-y-2">
                  <HelpCircle className="size-8 text-muted-foreground mx-auto" />
                  <div className="text-xs font-medium text-foreground">No Custom Question Responses</div>
                  <div className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    This job requisition did not configure mandatory custom questions or standard defaults were accepted.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 4. INTERVIEWS & EVALUATION */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Scheduled panel interview rounds and evaluation records:
                </span>
                <RoleGuard permission="canScheduleInterviews">
                  <Link href={`/interviews/schedule?candidateId=${app.candidateId}&applicationId=${app.id}`}>
                    <Button size="xs" variant="accent" className="gap-1 text-xs">
                      <Calendar className="size-3" />
                      <span>Schedule New Round</span>
                    </Button>
                  </Link>
                </RoleGuard>
              </div>

              {app.interviews && app.interviews.length > 0 ? (
                app.interviews.map((iv: any) => (
                  <Card key={iv.id} className="p-3.5 shadow-none border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="size-4 text-copper" />
                        <span className="text-xs font-semibold text-foreground">{iv.roundTitle}</span>
                        <Badge variant="outline" className="text-[10px] capitalize border-copper/30 text-copper">
                          {iv.roundType}
                        </Badge>
                      </div>
                      <Badge
                        variant={iv.status === "completed" ? "soft-success" : iv.status === "cancelled" ? "destructive" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {iv.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div>
                        <span className="text-[10px] uppercase block">Scheduled Date</span>
                        <span className="text-foreground font-medium">
                          {new Date(iv.scheduledStart).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase block">Duration</span>
                        <span className="text-foreground">{iv.durationMinutes || 45} Minutes</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase block">Format</span>
                        <span className="text-foreground capitalize">{iv.format || "Video"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase block">Meeting Link</span>
                        {iv.meetingLink ? (
                          <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-copper hover:underline truncate block"
                          >
                            Join Video Call
                          </a>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-8 border border-dashed border-border rounded-xs bg-muted/10 text-center space-y-2">
                  <Video className="size-8 text-muted-foreground mx-auto" />
                  <div className="text-xs font-medium text-foreground">No Interview Rounds Scheduled Yet</div>
                  <div className="text-[11px] text-muted-foreground">
                    Advance this candidate through screening or schedule an interview round using the button above.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
