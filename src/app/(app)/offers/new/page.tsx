"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  FileCheck,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getApplications } from "@/lib/actions/applications";
import { createOffer } from "@/lib/actions/offers";
import { getCurrencies } from "@/lib/actions/settings";

function CreateOfferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCandidateId = searchParams.get("candidateId");
  const paramApplicationId = searchParams.get("applicationId");

  const [applications, setApplications] = useState<any[]>([]);
  const [currenciesList, setCurrenciesList] = useState<any[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState(paramApplicationId || "");
  const [designation, setDesignation] = useState("Staff Software Engineer");
  const [departmentName, setDepartmentName] = useState("Engineering");
  const [baseSalary, setBaseSalary] = useState("175000");
  const [joiningDate, setJoiningDate] = useState("2026-09-15");
  const [reportingManager, setReportingManager] = useState("Engineering Director");
  const [workLocation, setWorkLocation] = useState("San Francisco HQ / Hybrid");
  const [benefits, setBenefits] = useState("Comprehensive Medical, Dental, Vision, 401(k) 4% Match, $3,000 Annual Learning Budget");

  useEffect(() => {
    async function load() {
      try {
        const [apps, currList] = await Promise.all([
          getApplications(),
          getCurrencies(),
        ]);
        setApplications(apps);
        setCurrenciesList(currList);
        if (currList[0]) setCurrency(currList[0].code);
        if (paramApplicationId) {
          setSelectedAppId(paramApplicationId);
          const found = apps.find((a) => a.id === paramApplicationId);
          if (found) {
            setDesignation(found.jobTitle || "Engineer");
            setDepartmentName(found.departmentName || "Engineering");
          }
        } else if (paramCandidateId) {
          const found = apps.find((a) => a.candidateId === paramCandidateId);
          if (found) {
            setSelectedAppId(found.id);
            setDesignation(found.jobTitle || "Engineer");
            setDepartmentName(found.departmentName || "Engineering");
          }
        } else if (apps[0]) {
          setSelectedAppId(apps[0].id);
          setDesignation(apps[0].jobTitle || "Engineer");
          setDepartmentName(apps[0].departmentName || "Engineering");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [paramApplicationId, paramCandidateId]);

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    const found = applications.find((a) => a.id === appId);
    if (found) {
      setDesignation(found.jobTitle || "Engineer");
      setDepartmentName(found.departmentName || "Engineering");
    }
  };

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) {
      toast.error("Please select an applicant");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOffer({
        applicationId: selectedApp.id,
        candidateId: selectedApp.candidateId,
        designation,
        departmentName,
        baseSalary: parseInt(baseSalary) || 150000,
        currency: "USD",
        joiningDate,
        reportingManager,
        workLocation,
        benefitsSummary: benefits,
      });

      toast.success(`Offer package created for ${selectedApp.candidateName}!`);
      router.push("/offers");
    } catch (err: any) {
      toast.error(err.message || "Failed to create offer package");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page max-w-4xl">
      <PageHeader
        title="Generate Offer Letter Package"
        description="Formal compensation package configuration, executive sign-off, and dynamic letter generation."
        breadcrumbs={[
          { label: "Offers", href: "/offers" },
          { label: "Create Offer" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/offers">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="size-3.5" />
                <span>Cancel</span>
              </Button>
            </Link>
            <Button
              size="sm"
              variant="accent"
              disabled={isSubmitting || loading}
              onClick={handleSubmit}
              className="gap-1 text-xs"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              <span>Save &amp; Generate Offer</span>
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Candidate & Role Parameters */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">1. Candidate &amp; Designation</CardTitle>
            <CardDescription className="text-xs">
              Selected candidate, role title, and department
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="field-label">Select Candidate Application *</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => handleAppSelect(e.target.value)}
                  className="h-8 w-full rounded-xs border border-border bg-card px-2.5 text-xs text-foreground focus:border-ring"
                >
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidateName} — {a.jobTitle} ({a.departmentName || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Designation / Official Title *</label>
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Department *</label>
                <Input
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Reporting Manager</label>
                <Input
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Work Location</label>
                <Input
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Timeline */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">2. Compensation &amp; Timeline</CardTitle>
            <CardDescription className="text-xs">
              Annual salary, proposed joining date, and provisions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="field-label">Currency *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-8 w-full rounded-xs border border-border bg-card px-2.5 text-xs text-foreground focus:border-ring"
                >
                  {currenciesList.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="field-label">Annual Base Salary ({currency}) *</label>
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="h-8 text-xs tabular"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <label className="field-label">Proposed Joining Date</label>
                <Input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="field-label">Benefits Summary</label>
                <Textarea
                  rows={2}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link href="/offers">
            <Button variant="outline" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            variant="accent"
            disabled={isSubmitting}
            className="gap-1.5 text-xs"
          >
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            <span>Save &amp; Generate Offer</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateOfferPage() {
  return (
    <Suspense fallback={<div className="page p-8 text-xs text-muted-foreground">Loading offer creator...</div>}>
      <CreateOfferContent />
    </Suspense>
  );
}
