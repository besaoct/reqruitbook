"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Calendar,
  Gift,
  XCircle,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TableShell,
  Table,
  THead,
  TH,
  SortableTH,
  TBody,
  TR,
  TD,
  EmptyRow,
  ClientPagination,
} from "@/components/shared/data-table";
import { toast } from "sonner";
import { getApplications, updateApplicationStage, rejectApplication, type ApplicationStage } from "@/lib/actions/applications";
import { getJobs } from "@/lib/actions/jobs";
import { RoleGuard } from "@/components/auth/role-guard";

const KANBAN_STAGES: { id: ApplicationStage; name: string; color: string }[] = [
  { id: "applied", name: "Applied", color: "border-t-bark-muted" },
  { id: "screening", name: "Screening", color: "border-t-copper-deep" },
  { id: "shortlisted", name: "Shortlisted", color: "border-t-copper" },
  { id: "interview", name: "Interview", color: "border-t-sage-deep" },
  { id: "evaluation", name: "Evaluation", color: "border-t-sage" },
  { id: "selected", name: "Selected", color: "border-t-bark" },
  { id: "offer", name: "Offer Stage", color: "border-t-accent" },
  { id: "hired", name: "Hired (HRM)", color: "border-t-success" },
];

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawJobId = searchParams.get("jobId");
  const rawStage = searchParams.get("stage");

  const [activeView, setActiveView] = useState<"kanban" | "list">("kanban");
  const [selectedJobId, setSelectedJobId] = useState(rawJobId || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Horizontal Scroll & Fading for Kanban
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    // Initial check after paint
    const timer = setTimeout(checkScroll, 100);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, applications, activeView]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 320;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Table Sorting and Client Pagination
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<string>("candidateName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Reject modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("Profile does not meet core technical bar.");
  const [isRejecting, setIsRejecting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appList, jobList] = await Promise.all([
        getApplications({
          jobId: selectedJobId === "all" ? undefined : selectedJobId,
        }),
        getJobs(),
      ]);
      setApplications(appList);
      setJobs(jobList);
    } catch (err) {
      console.error("Failed to load applications:", err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedJobId]);

  const handleStageChange = async (appId: string, newStage: ApplicationStage) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, stage: newStage } : app)),
    );

    try {
      await updateApplicationStage(appId, newStage);
      toast.success(`Application updated to ${newStage.toUpperCase()}`);
    } catch {
      toast.error("Failed to update application stage");
      await loadData();
    }
  };

  const handleReject = async () => {
    if (!rejectingAppId) return;
    setIsRejecting(true);
    try {
      await rejectApplication(rejectingAppId, rejectReason);
      toast.success("Application marked as rejected.");
      setRejectingAppId(null);
      await loadData();
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = app.candidateName?.toLowerCase().includes(q);
      const matchJob = app.jobTitle?.toLowerCase().includes(q);
      const matchEmail = app.candidateEmail?.toLowerCase().includes(q);
      if (!matchName && !matchJob && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="page max-w-full space-y-4">
      <PageHeader
        title="ATS Candidate Kanban & Pipeline"
        description="Live 8-stage recruitment pipeline, structured panel interview routing, and offer generation."
        actions={
          <div className="flex items-center gap-2">
            <RoleGuard permission="canScheduleInterviews">
              <Link href="/interviews/schedule">
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  <Calendar className="size-3.5" />
                  <span>Schedule Interview</span>
                </Button>
              </Link>
            </RoleGuard>
            <RoleGuard permission="canCreateOffers">
              <Link href="/offers/new">
                <Button size="sm" variant="accent" className="gap-1 text-xs">
                  <Gift className="size-3.5" />
                  <span>Generate Offer</span>
                </Button>
              </Link>
            </RoleGuard>
          </div>
        }
      />

      {/* Filter and View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 border-b border-border w-fit">
          <button
            type="button"
            onClick={() => setActiveView("kanban")}
            className={cn(
              "text-xs py-2 px-1 font-medium transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer",
              activeView === "kanban"
                ? "border-copper text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60",
            )}
          >
            Kanban Board
          </button>
          <button
            type="button"
            onClick={() => setActiveView("list")}
            className={cn(
              "text-xs py-2 px-1 font-medium transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer",
              activeView === "list"
                ? "border-copper text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60",
            )}
          >
            List View
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick chevron scroll buttons in header for kanban */}
          {activeView === "kanban" && (
            <div className="hidden sm:flex items-center gap-1 pr-1">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll pipeline left"
                className="size-7 rounded-xs border border-border bg-card text-foreground hover:bg-muted hover:text-copper flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Scroll pipeline left"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll pipeline right"
                className="size-7 rounded-xs border border-border bg-card text-foreground hover:bg-muted hover:text-copper flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Scroll pipeline right"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}

          {/* Job Filter Dropdown */}
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="h-7 px-2.5 text-xs rounded-xs border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-copper cursor-pointer"
          >
            <option value="all">All Job Requisitions ({applications.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.departmentName || "General"})
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7 text-xs bg-card"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin text-copper" />
          <span>Loading ATS Kanban pipeline from database...</span>
        </div>
      ) : activeView === "kanban" ? (
        /* KANBAN BOARD VIEW (8 Stages with fixed width & smooth horizontal scroll) */
        <div className="relative w-full group/kanban">
          {/* Left Edge Fading Mask & Floating Chevron */}
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-background via-background/80 to-transparent z-20 transition-all duration-300 flex items-center justify-start pl-1",
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll pipeline left"
              className="pointer-events-auto size-8 rounded-full bg-card/95 hover:bg-card border border-border hover:border-copper/60 shadow-md text-foreground hover:text-copper flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          {/* Right Edge Fading Mask & Floating Chevron */}
          <div
            className={cn(
              "pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-20 transition-all duration-300 flex items-center justify-end pr-1",
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll pipeline right"
              className="pointer-events-auto size-8 rounded-full bg-card/95 hover:bg-card border border-border hover:border-copper/60 shadow-md text-foreground hover:text-copper flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Kanban Columns Row */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-3.5 overflow-x-auto pb-4 pt-1 scroll-smooth no-scrollbar select-none"
          >
            {KANBAN_STAGES.map((col) => {
              const colApps = filteredApplications.filter((a) => a.stage === col.id);
              return (
                <div
                  key={col.id}
                  className={`w-[290px] min-w-[290px] max-w-[290px] shrink-0 flex flex-col bg-muted/30 rounded-xs border border-border border-t-2 ${col.color} p-2.5 min-h-[580px]`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {col.name}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-xs bg-muted border border-border/50 text-foreground font-medium">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Candidate Cards */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5 no-scrollbar">
                    {colApps.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center text-[11px] text-muted-foreground border border-dashed border-border/60 rounded-xs bg-muted/10 gap-1">
                        <span>No candidates</span>
                        <span className="text-[10px] opacity-60">in this stage</span>
                      </div>
                    ) : (
                      colApps.map((app) => (
                        <Card
                          key={app.id}
                          className="shadow-none border border-border bg-card hover:border-copper/60 hover:shadow-xs transition-all p-3 space-y-2.5 rounded-xs group"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-xs text-foreground block hover:text-copper transition-colors truncate">
                                {app.candidateName}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate block">
                                {app.jobTitle}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] px-1.5 py-0 shrink-0 font-medium",
                                (app.fitScore || 0) >= 85
                                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                  : (app.fitScore || 0) >= 70
                                  ? "border-copper/30 text-copper bg-copper/10"
                                  : "border-border text-muted-foreground bg-muted/40",
                              )}
                            >
                              {app.fitScore}% Fit
                            </Badge>
                          </div>

                          {/* Experience / Info */}
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <div className="truncate text-foreground font-medium">
                              {app.currentDesignation || "Software Engineer"}
                            </div>
                            <div className="text-[10px] flex items-center justify-between text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-muted-foreground/70" />
                                <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                              </span>
                              {app.source && (
                                <span className="text-[10px] capitalize text-muted-foreground/80 truncate max-w-[100px]">
                                  {app.source}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Stage Mover Dropdown */}
                          <RoleGuard permission="canAdvancePipeline">
                            <div className="pt-2 border-t border-border/60">
                              <select
                                value={app.stage}
                                onChange={(e) => handleStageChange(app.id, e.target.value as any)}
                                className="h-6.5 text-[11px] rounded-xs border border-border bg-muted/40 hover:bg-muted px-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-copper w-full font-medium transition-colors cursor-pointer"
                              >
                                {KANBAN_STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Move: {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </RoleGuard>

                          {/* Quick Actions Bar */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                            <RoleGuard permission="canScheduleInterviews">
                              <Link
                                href={`/interviews/schedule?candidateId=${app.candidateId}&applicationId=${app.id}`}
                                className="hover:text-copper flex items-center gap-0.5 py-0.5 px-1 rounded-xs hover:bg-muted/60 transition-colors"
                                title="Schedule Interview"
                              >
                                <Calendar className="size-3 text-copper" />
                                <span>Interview</span>
                              </Link>
                            </RoleGuard>

                            <RoleGuard permission="canCreateOffers">
                              <Link
                                href={`/offers/new?candidateId=${app.candidateId}&applicationId=${app.id}`}
                                className="hover:text-copper flex items-center gap-0.5 py-0.5 px-1 rounded-xs hover:bg-muted/60 transition-colors"
                                title="Generate Offer"
                              >
                                <Gift className="size-3 text-sage-deep" />
                                <span>Offer</span>
                              </Link>
                            </RoleGuard>

                            <RoleGuard permission="canAdvancePipeline">
                              <button
                                type="button"
                                onClick={() => setRejectingAppId(app.id)}
                                className="hover:text-destructive flex items-center gap-0.5 py-0.5 px-1 rounded-xs hover:bg-destructive/10 transition-colors cursor-pointer"
                                title="Reject Candidate"
                              >
                                <XCircle className="size-3 text-destructive/70" />
                                <span>Reject</span>
                              </button>
                            </RoleGuard>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <TableShell>
          <Table>
            <THead>
              <SortableTH
                field="candidateName"
                currentSort={sortField === "candidateName" ? (sortDirection === "asc" ? "candidateName" : "-candidateName") : ""}
                onSort={(f, d) => {
                  setSortField(f);
                  setSortDirection(d);
                }}
              >
                Candidate Name
              </SortableTH>
              <TH>Target Requisition</TH>
              <SortableTH
                field="fitScore"
                currentSort={sortField === "fitScore" ? (sortDirection === "asc" ? "fitScore" : "-fitScore") : ""}
                onSort={(f, d) => {
                  setSortField(f);
                  setSortDirection(d);
                }}
              >
                AI Fit Score
              </SortableTH>
              <TH>Recruitment Stage</TH>
              <TH>Source</TH>
              <TH align="right">Pipeline Actions</TH>
            </THead>
            <TBody>
              {filteredApplications.length === 0 ? (
                <EmptyRow colSpan={6}>No applications found matching criteria.</EmptyRow>
              ) : (
                [...filteredApplications]
                  .sort((a, b) => {
                    let aVal = a[sortField];
                    let bVal = b[sortField];
                    if (typeof aVal === "string") {
                      aVal = aVal.toLowerCase();
                      bVal = (bVal || "").toLowerCase();
                    }
                    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                  .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                  .map((app) => (
                    <TR key={app.id}>
                      <TD>
                        <div>
                          <span className="font-semibold text-foreground text-xs block">
                            {app.candidateName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{app.candidateEmail}</span>
                        </div>
                      </TD>

                      <TD>
                        <span className="font-medium text-foreground text-xs">{app.jobTitle}</span>
                      </TD>

                      <TD>
                        <Badge variant="outline" className="text-[10px] border-copper/30 text-copper">
                          {app.fitScore}% Fit
                        </Badge>
                      </TD>

                      <TD>
                        <select
                          value={app.stage}
                          onChange={(e) => handleStageChange(app.id, e.target.value as any)}
                          className="h-7 text-xs rounded-xs border border-border bg-card px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-copper font-medium"
                        >
                          {KANBAN_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </TD>

                      <TD>
                        <span className="text-xs text-muted-foreground capitalize">{app.source || "Careers"}</span>
                      </TD>

                      <TD align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <RoleGuard permission="canScheduleInterviews">
                            <Link
                              href={`/interviews/schedule?candidateId=${app.candidateId}&applicationId=${app.id}`}
                            >
                              <Button size="xs" variant="outline" className="gap-1 text-xs h-7">
                                <Calendar className="size-3 text-copper" />
                                <span>Interview</span>
                              </Button>
                            </Link>
                          </RoleGuard>

                          <RoleGuard permission="canCreateOffers">
                            <Link
                              href={`/offers/new?candidateId=${app.candidateId}&applicationId=${app.id}`}
                            >
                              <Button size="xs" variant="accent" className="gap-1 text-xs h-7">
                                <Gift className="size-3" />
                                <span>Offer</span>
                              </Button>
                            </Link>
                          </RoleGuard>

                          <RoleGuard permission="canAdvancePipeline">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setRejectingAppId(app.id)}
                              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              title="Reject Application"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          </RoleGuard>
                        </div>
                      </TD>
                    </TR>
                  ))
              )}
            </TBody>
          </Table>

          <ClientPagination
            page={tablePage}
            limit={tablePageSize}
            total={filteredApplications.length}
            onPageChange={setTablePage}
            onLimitChange={setTablePageSize}
            limitOptions={[10, 25, 50, 100]}
          />
        </TableShell>
      )}

      {/* Reject Application Modal */}
      <Dialog open={!!rejectingAppId} onOpenChange={(open) => !open && setRejectingAppId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Reject Candidate Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Provide feedback or rejection reason for internal records:
            </p>
            <div className="space-y-1">
              <label className="field-label">Reason / Feedback</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xs border border-border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="xs" variant="outline" onClick={() => setRejectingAppId(null)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="destructive"
              disabled={isRejecting}
              onClick={handleReject}
              className="gap-1"
            >
              {isRejecting ? <Loader2 className="size-3 animate-spin" /> : null}
              <span>Confirm Rejection</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="page p-8 text-xs text-muted-foreground">Loading ATS Kanban...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
