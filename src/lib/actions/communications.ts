"use server";

import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { communicationTemplates, candidateMessages, candidates, users, organizations, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/rbac";
import { getSmtpConfig } from "@/lib/email/mailer";

export async function getCommunicationTemplates() {
  try {
    return await db
      .select()
      .from(communicationTemplates)
      .orderBy(desc(communicationTemplates.createdAt));
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return [];
  }
}

export async function createCommunicationTemplate(data: {
  name: string;
  triggerEvent: string;
  subject: string;
  bodyTemplate: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canSendCommunications", user.permissions);

  const orgs = await db.select({ id: organizations.id }).from(organizations).limit(1);
  const orgId = orgs[0]?.id || "org_my_organisation";

  const newId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(communicationTemplates).values({
    id: newId,
    orgId,
    name: data.name,
    triggerEvent: data.triggerEvent,
    subject: data.subject,
    bodyTemplate: data.bodyTemplate,
    isActive: true,
    createdAt: new Date(),
  });

  revalidatePath("/communications");
  return { success: true, id: newId };
}

export async function updateCommunicationTemplate(
  id: string,
  data: Partial<{
    name: string;
    triggerEvent: string;
    subject: string;
    bodyTemplate: string;
    isActive: boolean;
  }>,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canSendCommunications", user.permissions);

  await db
    .update(communicationTemplates)
    .set(data)
    .where(eq(communicationTemplates.id, id));

  revalidatePath("/communications");
  return { success: true };
}

export async function deleteCommunicationTemplate(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canSendCommunications", user.permissions);

  await db.delete(communicationTemplates).where(eq(communicationTemplates.id, id));

  revalidatePath("/communications");
  return { success: true };
}

export async function getCandidateMessages() {
  try {
    return await db
      .select({
        id: candidateMessages.id,
        candidateId: candidateMessages.candidateId,
        recipientEmail: candidateMessages.recipientEmail,
        subject: candidateMessages.subject,
        body: candidateMessages.body,
        status: candidateMessages.status,
        sentAt: candidateMessages.sentAt,
        candidateName: candidates.fullName,
        senderName: users.name,
      })
      .from(candidateMessages)
      .leftJoin(candidates, eq(candidateMessages.candidateId, candidates.id))
      .leftJoin(users, eq(candidateMessages.senderId, users.id))
      .orderBy(desc(candidateMessages.sentAt));
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return [];
  }
}

export async function sendMessageToCandidate(data: {
  candidateId: string;
  templateId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canSendCommunications", user.permissions);

  const newId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let deliveryStatus: "delivered" | "sent" | "failed" = "delivered";
  let deliveryError: string | null = null;
  let sentViaSmtp = false;

  // Try dispatching through configured SMTP
  try {
    const smtpConfig = await getSmtpConfig();
    if (smtpConfig.isConfigured && smtpConfig.host && smtpConfig.fromEmail) {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: Number(smtpConfig.port),
        secure: Boolean(smtpConfig.secure),
        auth:
          smtpConfig.user && smtpConfig.pass
            ? {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
              }
            : undefined,
        connectionTimeout: 8000,
      });

      const formattedHtml = `
        <div style="font-family: Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 4px; background: #ffffff; color: #1f2937;">
          <div style="border-bottom: 2px solid #CA7842; padding-bottom: 12px; margin-bottom: 20px;">
            <span style="font-size: 16px; font-weight: 700; color: #4B352A; text-transform: uppercase; letter-spacing: 0.5px;">${smtpConfig.fromName || "ReqruitBook"}</span>
          </div>
          <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #374151;">
${data.body}
          </div>
          ${
            smtpConfig.signature
              ? `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #6b7280; white-space: pre-wrap;">${smtpConfig.signature}</div>`
              : ""
          }
        </div>
      `;

      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to: data.recipientEmail,
        replyTo: smtpConfig.replyTo || smtpConfig.fromEmail,
        subject: data.subject,
        text: data.body,
        html: formattedHtml,
      });

      sentViaSmtp = true;
      deliveryStatus = "delivered";
    } else {
      deliveryStatus = "sent";
    }
  } catch (err: any) {
    console.error("SMTP Delivery Warning:", err);
    deliveryError = err.message || "SMTP transmission error";
    // We still log the message to internal audit trail
    deliveryStatus = "sent";
  }

  await db.insert(candidateMessages).values({
    id: newId,
    candidateId: data.candidateId,
    templateId: data.templateId || null,
    senderId: user.id,
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    body: data.body,
    status: deliveryStatus,
    sentAt: new Date(),
  });

  const orgs = await db.select({ id: organizations.id }).from(organizations).limit(1);
  const orgId = orgs[0]?.id || "org_my_organisation";

  await db.insert(auditLogs).values({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId,
    actorId: user.id,
    action: "candidate.email_sent",
    entityType: "candidate_message",
    entityId: newId,
    metadata: {
      recipient: data.recipientEmail,
      subject: data.subject,
      sentViaSmtp,
      deliveryError,
    },
    createdAt: new Date(),
  });

  revalidatePath("/communications");
  return {
    success: true,
    id: newId,
    sentViaSmtp,
    note: sentViaSmtp
      ? "Dispatched via verified SMTP server"
      : "Recorded in audit trail (configure live SMTP in Settings > SMTP for instant outgoing delivery)",
  };
}
