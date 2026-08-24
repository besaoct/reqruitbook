"use client";

import React from "react";
import { ReqruitBookProvider } from "./context";
import type { ReqruitBookHostConfig, HiredCandidatePayload } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, Building2, UserCheck, Sparkles } from "lucide-react";

/**
 * Universal Embed Widget wrapper for host software (e.g. HRM, ERP)
 */
export function ReqruitBookEmbedContainer({
  config,
  children,
  className = "",
}: {
  config?: ReqruitBookHostConfig;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ReqruitBookProvider config={{ ...config, isEmbedded: true }}>
      <div className={`reqruitbook-embedded-widget antialiased text-foreground ${className}`}>
        {children}
      </div>
    </ReqruitBookProvider>
  );
}

/**
 * Embeddable HRM Sync Card Component
 * Shows how ReqruitBook synchronizes Hired candidates directly into an external HRM system.
 */
export function HrmSyncCard({
  candidate,
  onSync,
}: {
  candidate: {
    name: string;
    role: string;
    department: string;
    salary: string;
    joiningDate: string;
  };
  onSync?: () => void;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xs bg-sage/20 text-success">
              <CheckCircle2 className="size-4" />
            </span>
            <CardTitle className="text-sm">HRM Employee Bridge</CardTitle>
          </div>
          <Badge variant="soft-success">Ready for Onboarding</Badge>
        </div>
        <CardDescription className="text-xs">
          Automatic candidate profile conversion to HRM Employee record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xs border border-border">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Candidate</span>
            <span className="font-medium text-foreground">{candidate.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Designation</span>
            <span className="font-medium text-foreground">{candidate.role}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Department</span>
            <span className="font-medium text-foreground">{candidate.department}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Joining Date</span>
            <span className="font-medium text-foreground">{candidate.joiningDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
            <Building2 className="size-3.5" />
            <span>Target HRM: Auto-Sync Enabled</span>
          </div>
          <Button
            size="xs"
            variant="accent"
            onClick={onSync}
            className="gap-1"
          >
            <UserCheck className="size-3" />
            <span>Create Employee Profile</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
