"use server";

import { db } from "@/db";
import {
  jobApplications,
  candidates,
  jobOpenings,
  interviews,
  interviewScorecards,
  offers,
  candidateMessages,
} from "@/db/schema";
import { eq, desc, and, sql, notExists } from "drizzle-orm";

export interface SystemNotification {
  id: string;
  type: "application" | "interview" | "scorecard" | "offer" | "communication" | "system";
  title: string;
  message: string;
  timestamp: string;
  timeAgo: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  href: string;
  actionLabel: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export async function getSystemNotifications(): Promise<{
  notifications: SystemNotification[];
  unreadCount: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [recentApps, upcomingInterviews, pendingScorecards, pendingOffersList, recentMessages] =
      await Promise.all([
        // 1. Recent applications (applied or screening)
        db
          .select({
            id: jobApplications.id,
            candidateName: candidates.fullName,
            jobTitle: jobOpenings.title,
            stage: jobApplications.stage,
            createdAt: jobApplications.createdAt,
          })
          .from(jobApplications)
          .leftJoin(candidates, eq(jobApplications.candidateId, candidates.id))
          .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
          .orderBy(desc(jobApplications.createdAt))
          .limit(8),

        // 2. Scheduled/Confirmed upcoming interviews
        db
          .select({
            id: interviews.id,
            applicationId: interviews.applicationId,
            roundTitle: interviews.roundTitle,
            roundType: interviews.roundType,
            status: interviews.status,
            scheduledStart: interviews.scheduledStart,
            format: interviews.format,
            candidateName: candidates.fullName,
            jobTitle: jobOpenings.title,
          })
          .from(interviews)
          .leftJoin(jobApplications, eq(interviews.applicationId, jobApplications.id))
          .leftJoin(candidates, eq(jobApplications.candidateId, candidates.id))
          .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
          .where(sql`${interviews.status} IN ('scheduled', 'confirmed')`)
          .orderBy(desc(interviews.scheduledStart))
          .limit(6),

        // 3. Completed interviews without scorecards
        db
          .select({
            id: interviews.id,
            roundTitle: interviews.roundTitle,
            candidateName: candidates.fullName,
            jobTitle: jobOpenings.title,
            completedAt: interviews.scheduledStart,
          })
          .from(interviews)
          .leftJoin(jobApplications, eq(interviews.applicationId, jobApplications.id))
          .leftJoin(candidates, eq(jobApplications.candidateId, candidates.id))
          .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
          .where(
            and(
              eq(interviews.status, "completed"),
              notExists(
                db
                  .select()
                  .from(interviewScorecards)
                  .where(eq(interviewScorecards.interviewId, interviews.id))
              )
            )
          )
          .orderBy(desc(interviews.scheduledStart))
          .limit(4),

        // 4. Pending / Draft Offers
        db
          .select({
            id: offers.id,
            applicationId: offers.applicationId,
            candidateName: candidates.fullName,
            jobTitle: jobOpenings.title,
            salary: offers.baseSalary,
            status: offers.status,
            createdAt: offers.createdAt,
          })
          .from(offers)
          .leftJoin(jobApplications, eq(offers.applicationId, jobApplications.id))
          .leftJoin(candidates, eq(jobApplications.candidateId, candidates.id))
          .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
          .where(sql`${offers.status} IN ('draft', 'pending_approval', 'approved')`)
          .orderBy(desc(offers.createdAt))
          .limit(4),

        // 5. Recent Dispatched Communications
        db
          .select({
            id: candidateMessages.id,
            recipientEmail: candidateMessages.recipientEmail,
            subject: candidateMessages.subject,
            status: candidateMessages.status,
            sentAt: candidateMessages.sentAt,
          })
          .from(candidateMessages)
          .orderBy(desc(candidateMessages.sentAt))
          .limit(3),
      ]);

    const notifications: SystemNotification[] = [];

    // Map Recent Applications
    for (const app of recentApps) {
      notifications.push({
        id: `notif_app_${app.id}`,
        type: "application",
        title: `New Candidate: ${app.candidateName || "Applicant"}`,
        message: `Submitted application for ${app.jobTitle || "Open Role"} (Stage: ${app.stage.toUpperCase()})`,
        timestamp: app.createdAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(app.createdAt)),
        read: false,
        priority: app.stage === "applied" ? "high" : "medium",
        href: `/applications?stage=${app.stage}`,
        actionLabel: "Review Applicant",
      });
    }

    // Map Upcoming Interviews
    for (const iv of upcomingInterviews) {
      const startTime = new Date(iv.scheduledStart);
      const isToday = startTime.toDateString() === new Date().toDateString();
      notifications.push({
        id: `notif_iv_${iv.id}`,
        type: "interview",
        title: `${iv.roundTitle || "Interview Round"} with ${iv.candidateName || "Candidate"}`,
        message: `${iv.jobTitle || "Role"} · ${isToday ? "Scheduled Today" : startTime.toLocaleDateString()} (${iv.format || "Video"})`,
        timestamp: iv.scheduledStart.toISOString(),
        timeAgo: formatTimeAgo(startTime),
        read: false,
        priority: isToday ? "high" : "medium",
        href: `/interviews`,
        actionLabel: "View Schedule",
      });
    }

    // Map Pending Scorecards
    for (const sc of pendingScorecards) {
      notifications.push({
        id: `notif_sc_${sc.id}`,
        type: "scorecard",
        title: `Scorecard Feedback Required`,
        message: `Interview debrief pending for ${sc.candidateName || "Candidate"} (${sc.roundTitle || "Round"})`,
        timestamp: sc.completedAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(sc.completedAt)),
        read: false,
        priority: "high",
        href: `/interviews`,
        actionLabel: "Submit Scorecard",
      });
    }

    // Map Offers
    for (const off of pendingOffersList) {
      notifications.push({
        id: `notif_off_${off.id}`,
        type: "offer",
        title: `Offer Package ${off.status === "draft" ? "Drafted" : "Ready for Approval"}`,
        message: `${off.candidateName || "Candidate"} · $${Number(off.salary || 0).toLocaleString()} / yr (${off.jobTitle || "Role"})`,
        timestamp: off.createdAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(off.createdAt)),
        read: false,
        priority: off.status === "pending_approval" ? "high" : "medium",
        href: `/offers`,
        actionLabel: "Review Offer",
      });
    }

    // Map Messages
    for (const msg of recentMessages) {
      notifications.push({
        id: `notif_msg_${msg.id}`,
        type: "communication",
        title: `Email Dispatched: ${msg.subject}`,
        message: `Sent to ${msg.recipientEmail} (${msg.status.toUpperCase()})`,
        timestamp: msg.sentAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(msg.sentAt)),
        read: true,
        priority: "low",
        href: `/communications?tab=history`,
        actionLabel: "View Audit Log",
      });
    }

    // Sort by timestamp descending
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      notifications,
      unreadCount,
    };
  } catch (err) {
    console.error("Failed to get system notifications:", err);
    return {
      notifications: [],
      unreadCount: 0,
    };
  }
}
