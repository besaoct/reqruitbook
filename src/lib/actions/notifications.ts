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
  organizations,
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

    const [
      orgList,
      recentApps,
      upcomingInterviews,
      pendingScorecards,
      pendingOffersList,
      recentMessages,
    ] = await Promise.all([
      // 0. Organization settings for persistent read notification IDs
      db
        .select({ id: organizations.id, settings: organizations.settings })
        .from(organizations)
        .limit(1),

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

    const org = orgList[0];
    const readNotifIds = new Set<string>(
      (org?.settings?.readNotificationIds as string[]) || []
    );

    const notifications: SystemNotification[] = [];

    // Map Recent Applications
    for (const app of recentApps) {
      const id = `notif_app_${app.id}`;
      notifications.push({
        id,
        type: "application",
        title: `New Candidate: ${app.candidateName || "Applicant"}`,
        message: `Submitted application for ${app.jobTitle || "Open Role"} (Stage: ${app.stage.toUpperCase()})`,
        timestamp: app.createdAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(app.createdAt)),
        read: readNotifIds.has(id),
        priority: app.stage === "applied" ? "high" : "medium",
        href: `/applications?stage=${app.stage}`,
        actionLabel: "Review Applicant",
      });
    }

    // Map Upcoming Interviews
    for (const iv of upcomingInterviews) {
      const id = `notif_iv_${iv.id}`;
      const startTime = new Date(iv.scheduledStart);
      const isToday = startTime.toDateString() === new Date().toDateString();
      notifications.push({
        id,
        type: "interview",
        title: `${iv.roundTitle || "Interview Round"} with ${iv.candidateName || "Candidate"}`,
        message: `${iv.jobTitle || "Role"} · ${isToday ? "Scheduled Today" : startTime.toLocaleDateString()} (${iv.format || "Video"})`,
        timestamp: iv.scheduledStart.toISOString(),
        timeAgo: formatTimeAgo(startTime),
        read: readNotifIds.has(id),
        priority: isToday ? "high" : "medium",
        href: `/interviews`,
        actionLabel: "View Schedule",
      });
    }

    // Map Pending Scorecards
    for (const sc of pendingScorecards) {
      const id = `notif_sc_${sc.id}`;
      notifications.push({
        id,
        type: "scorecard",
        title: `Scorecard Feedback Required`,
        message: `Interview debrief pending for ${sc.candidateName || "Candidate"} (${sc.roundTitle || "Round"})`,
        timestamp: sc.completedAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(sc.completedAt)),
        read: readNotifIds.has(id),
        priority: "high",
        href: `/interviews`,
        actionLabel: "Submit Scorecard",
      });
    }

    // Map Offers
    for (const off of pendingOffersList) {
      const id = `notif_off_${off.id}`;
      notifications.push({
        id,
        type: "offer",
        title: `Offer Package ${off.status === "draft" ? "Drafted" : "Ready for Approval"}`,
        message: `${off.candidateName || "Candidate"} · $${Number(off.salary || 0).toLocaleString()} / yr (${off.jobTitle || "Role"})`,
        timestamp: off.createdAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(off.createdAt)),
        read: readNotifIds.has(id),
        priority: off.status === "pending_approval" ? "high" : "medium",
        href: `/offers`,
        actionLabel: "Review Offer",
      });
    }

    // Map Messages
    for (const msg of recentMessages) {
      const id = `notif_msg_${msg.id}`;
      notifications.push({
        id,
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

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    const orgList = await db
      .select({ id: organizations.id, settings: organizations.settings })
      .from(organizations)
      .limit(1);

    if (!orgList.length) return { success: false };
    const org = orgList[0];
    const currentSettings = (org.settings as Record<string, any>) || {};
    const currentReadIds = new Set<string>(currentSettings.readNotificationIds || []);
    currentReadIds.add(notificationId);

    const updatedReadIds = Array.from(currentReadIds).slice(-300);

    await db
      .update(organizations)
      .set({
        settings: {
          ...currentSettings,
          readNotificationIds: updatedReadIds,
        },
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));

    return { success: true };
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean }> {
  try {
    const orgList = await db
      .select({ id: organizations.id, settings: organizations.settings })
      .from(organizations)
      .limit(1);

    if (!orgList.length) return { success: false };
    const org = orgList[0];
    const currentSettings = (org.settings as Record<string, any>) || {};
    const currentReadIds = new Set<string>(currentSettings.readNotificationIds || []);

    for (const id of notificationIds) {
      currentReadIds.add(id);
    }

    const updatedReadIds = Array.from(currentReadIds).slice(-300);

    await db
      .update(organizations)
      .set({
        settings: {
          ...currentSettings,
          readNotificationIds: updatedReadIds,
        },
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));

    return { success: true };
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    return { success: false };
  }
}
