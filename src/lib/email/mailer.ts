"use server";

import nodemailer from "nodemailer";
import { db } from "@/db";
import { organizations, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  signature?: string;
  autoSendApplicationConfirmation?: boolean;
  autoSendInterviewInvite?: boolean;
  autoSendOfferNotice?: boolean;
  isConfigured?: boolean;
  lastTestedAt?: string;
  lastTestStatus?: "success" | "error";
  lastTestMessage?: string;
}

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: "smtp.resend.com",
  port: 587,
  secure: false,
  user: "resend",
  pass: "",
  fromName: "ReqruitBook Talent Team",
  fromEmail: "talent@reqruitbook.com",
  replyTo: "recruiting@reqruitbook.com",
  signature: "--\nReqruitBook Talent Team\nhttps://reqruitbook.com",
  autoSendApplicationConfirmation: true,
  autoSendInterviewInvite: true,
  autoSendOfferNotice: true,
  isConfigured: false,
};

export async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const orgList = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .limit(1);

    const settings = orgList[0]?.settings || {};
    const smtp = settings.smtp as SmtpConfig | undefined;

    if (!smtp) {
      return DEFAULT_SMTP_CONFIG;
    }

    return {
      ...DEFAULT_SMTP_CONFIG,
      ...smtp,
    };
  } catch (error) {
    console.error("Failed to load SMTP configuration:", error);
    return DEFAULT_SMTP_CONFIG;
  }
}

export async function saveSmtpConfig(config: Partial<SmtpConfig>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canManageSettings", user.permissions);

  const orgList = await db
    .select({ id: organizations.id, settings: organizations.settings })
    .from(organizations)
    .limit(1);

  const org = orgList[0];
  if (!org) throw new Error("Organization not found");

  const currentSettings = org.settings || {};
  const currentSmtp = (currentSettings.smtp as SmtpConfig) || DEFAULT_SMTP_CONFIG;

  const updatedSmtp: SmtpConfig = {
    ...currentSmtp,
    ...config,
    isConfigured: Boolean(config.host && config.fromEmail),
  };

  await db
    .update(organizations)
    .set({
      settings: {
        ...currentSettings,
        smtp: updatedSmtp,
      },
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, org.id));

  await db.insert(auditLogs).values({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId: org.id,
    actorId: user.id,
    action: "smtp.configuration_saved",
    entityType: "organization",
    entityId: org.id,
    metadata: {
      host: updatedSmtp.host,
      port: updatedSmtp.port,
      fromEmail: updatedSmtp.fromEmail,
      updatedBy: user.name,
    },
    createdAt: new Date(),
  });

  revalidatePath("/settings");
  revalidatePath("/communications");

  return { success: true, config: updatedSmtp };
}

export async function testSmtpConnection(
  testEmail: string,
  customConfig?: Partial<SmtpConfig>,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  assertPermission(user.role, "canManageSettings", user.permissions);

  const currentConfig = await getSmtpConfig();
  const config = { ...currentConfig, ...customConfig };

  if (!config.host || !config.port) {
    return {
      success: false,
      message: "SMTP Host and Port are required to test connection.",
      logs: ["Error: Missing host/port parameters."],
    };
  }

  const logs: string[] = [];
  logs.push(`[1/4] Initializing SMTP Transport with host: ${config.host}:${config.port} (Secure: ${config.secure ? "SSL" : "TLS/STARTTLS"})...`);

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port),
      secure: Boolean(config.secure),
      auth:
        config.user && config.pass
          ? {
              user: config.user,
              pass: config.pass,
            }
          : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    logs.push("[2/4] Verifying socket connection and credentials handshake...");
    await transporter.verify();
    logs.push("[3/4] SMTP server handshake successful! Verified credentials.");

    if (testEmail) {
      logs.push(`[4/4] Dispatching test verification email to ${testEmail}...`);
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: testEmail,
        replyTo: config.replyTo || config.fromEmail,
        subject: "ReqruitBook SMTP Live Verification Email",
        text: `Hello ${user.name},\n\nThis is a live test email verifying that your SMTP credentials for ${config.host}:${config.port} are correctly configured in ReqruitBook.\n\nSent at: ${new Date().toISOString()}\n\nBest regards,\nReqruitBook Team`,
        html: `
          <div style="font-family: Montserrat, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 4px; background: #ffffff;">
            <div style="border-bottom: 2px solid #CA7842; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #4B352A; margin: 0; font-size: 18px; text-transform: uppercase;">ReqruitBook SMTP Verified</h2>
              <span style="font-size: 12px; color: #6b7280;">Modern Recruitment &amp; Talent Platform</span>
            </div>
            <p style="font-size: 14px; color: #374151;">Hello <strong>${user.name}</strong>,</p>
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">
              This is a live test email confirming that your SMTP server connection to <strong>${config.host}:${config.port}</strong> is active and delivering emails successfully.
            </p>
            <div style="background: #FDF9F6; border-left: 3px solid #CA7842; padding: 12px; margin: 16px 0; font-size: 12px; color: #4B352A;">
              <strong>Active Sender:</strong> ${config.fromName} &lt;${config.fromEmail}&gt;<br/>
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
              Sent from ReqruitBook Email Engine
            </p>
          </div>
        `,
      });
      logs.push("✓ Test email delivered to SMTP mailbox!");
    }

    // Save last test status
    await saveSmtpConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: "success",
      lastTestMessage: `Verified successfully at ${new Date().toLocaleTimeString()}`,
    });

    return {
      success: true,
      message: `SMTP connection to ${config.host}:${config.port} verified successfully! Test email dispatched to ${testEmail}.`,
      logs,
    };
  } catch (err: any) {
    console.error("SMTP Test Error:", err);
    logs.push(`❌ Connection failed: ${err.message || String(err)}`);

    await saveSmtpConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: "error",
      lastTestMessage: err.message || "Connection failed",
    });

    return {
      success: false,
      message: err.message || "SMTP verification failed. Please check host, port, username, and password.",
      logs,
    };
  }
}

