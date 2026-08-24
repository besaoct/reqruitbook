import { db } from "./index";
import { communicationTemplates, organizations } from "./schema";
import { eq } from "drizzle-orm";

const ENTERPRISE_TEMPLATES = [
  {
    id: "tpl_app_confirm",
    orgId: "org_myorganisation",
    name: "Application Received Confirmation",
    triggerEvent: "applied",
    subject: "We received your application for {{job_title}} at {{company_name}} [{{req_code}}]",
    bodyTemplate: `Hi {{candidate_first_name}},

Thank you for taking the time to apply for the {{job_title}} position at {{company_name}}!

We wanted to confirm that our talent team has received your application materials. We are currently reviewing your profile against the technical and leadership requirements for this role.

What happens next:
1. Our recruiting team will review your background and portfolio.
2. If your experience aligns with what we're looking for, we will reach out within 3 to 5 business days to coordinate an initial discovery call.
3. You can track your application status anytime on our careers portal: {{careers_url}}.

We appreciate your interest in building the future with {{company_name}}.

Warm regards,

{{sender_name}}
Talent Acquisition Team · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_screen_invite",
    orgId: "org_myorganisation",
    name: "Recruiter Discovery Screening Invitation",
    triggerEvent: "screening",
    subject: "Invitation to Connect: {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_first_name}},

I hope this note finds you well!

Our engineering and talent teams reviewed your profile and resume for the {{job_title}} role, and we were very impressed by your background.

We would love to schedule a brief 25-minute discovery call to:
• Tell you more about our team mission, roadmap, and engineering culture.
• Learn more about your recent technical projects and what you're looking for in your next role.
• Answer any questions you have about {{company_name}}.

Please let me know a couple of time slots that work well for you this week, or use our scheduling calendar to pick a time: {{meeting_link}}

Looking forward to speaking with you!

Best regards,

{{sender_name}}
Lead Technical Recruiter · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_tech_assessment",
    orgId: "org_myorganisation",
    name: "Technical Take-Home Challenge & Specs",
    triggerEvent: "screening",
    subject: "Technical Evaluation Stage: {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_first_name}},

Thank you for the wonderful discovery conversation! We are excited to advance you to the technical assessment stage for the {{job_title}} position.

About the Challenge:
• Overview: A focused system implementation exercise designed to simulate real-world problems our team tackles daily.
• Estimated Time: ~2 to 3 hours. We value your personal time and do not expect overly complex boilerplate.
• Submission Deadline: 5 days from today.

Project Brief & Instructions:
Please access the assignment repository and submission instructions here: {{meeting_link}}

Evaluation Criteria:
1. Code architecture, modularity, and TypeScript type safety.
2. Error handling, edge cases, and performance considerations.
3. Clarity of your brief README walkthrough.

If you have any questions or need a deadline extension due to current work commitments, simply reply to this email.

Best of luck,

{{sender_name}}
Engineering Hiring Team · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_tech_panel_invite",
    orgId: "org_myorganisation",
    name: "System Design & Technical Panel Interview",
    triggerEvent: "interview",
    subject: "Interview Scheduled: Technical Panel for {{job_title}} ({{interview_date}})",
    bodyTemplate: `Hi {{candidate_first_name}},

Congratulations on advancing to our panel interview round for the {{job_title}} role!

Your Technical Architecture & System Design round has been confirmed with the following details:

📅 Date: {{interview_date}}
⏰ Time & Duration: {{interview_time}} (60 Minutes)
💻 Format: Video Conference
🔗 Video Meeting Link: {{meeting_link}}
👥 Panel Interviewer(s): {{interviewer_name}}

Round Focus:
• Architecture walkthrough, data modeling, scalability tradeoffs, and interactive problem solving.
• You will have the last 10 minutes to ask our engineers questions about our stack, workflows, and team dynamics.

Tips for the call:
• Ensure you have a quiet environment with stable internet and camera enabled.
• Feel free to have a notebook or whiteboard tool open for diagrams.

If you need to reschedule or run into any technical difficulties, please reply directly or reach out immediately.

Best regards,

{{sender_name}}
Talent Operations · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_culture_panel_invite",
    orgId: "org_myorganisation",
    name: "Culture & Leadership Values Interview",
    triggerEvent: "interview",
    subject: "Interview Scheduled: Leadership & Culture Fit for {{job_title}}",
    bodyTemplate: `Hi {{candidate_first_name}},

We are delighted to invite you to our Culture & Collaborative Leadership interview for the {{job_title}} position.

Interview Specifics:
📅 Scheduled Date: {{interview_date}}
⏰ Time: {{interview_time}} (45 Minutes)
🔗 Meeting Link: {{meeting_link}}
👤 Interviewer: {{interviewer_name}}

What to Expect:
This round focuses on cross-functional collaboration, problem resolution, how you mentor peers, and how your values align with our team principles of ownership, transparency, and relentless focus on user impact.

We encourage you to come with questions for us as well—interviews are a two-way street!

Warm regards,

{{sender_name}}
People & Talent Team · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_interview_reminder",
    orgId: "org_myorganisation",
    name: "24-Hour Interview Briefing & Reminder",
    triggerEvent: "interview",
    subject: "Reminder: Your interview tomorrow for {{job_title}} with {{company_name}}",
    bodyTemplate: `Hi {{candidate_first_name}},

This is a quick, friendly reminder regarding your interview tomorrow for the {{job_title}} role!

Summary Details:
• Scheduled Date: {{interview_date}} at {{interview_time}}
• Video Link: {{meeting_link}}
• Interviewer: {{interviewer_name}}

Please ensure you join 2 minutes early to check audio and video.

If any urgent scheduling conflict has arisen, please let us know as soon as possible so we can accommodate your calendar.

Looking forward to your session!

Best,

{{sender_name}}
Recruiting Operations · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_eval_update",
    orgId: "org_myorganisation",
    name: "Interview Feedback & Stage Progression Update",
    triggerEvent: "evaluation",
    subject: "Update on your interview loop for {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_first_name}},

Thank you for your time and energy during your recent interview rounds for the {{job_title}} position.

Our interview panel met for our debrief session today, and the feedback across your technical and leadership sessions was overwhelmingly positive! Our team was particularly impressed by your problem-solving depth and clear communication.

We are currently preparing the final steps in our hiring process and will follow up within 24 to 48 hours with next details.

Thank you again for your patience and enthusiasm throughout this process.

Best regards,

{{sender_name}}
Talent Acquisition · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_exec_sync",
    orgId: "org_myorganisation",
    name: "Final Executive Debrief & Leadership Sync",
    triggerEvent: "selected",
    subject: "Next Steps: Final Executive Conversation for {{job_title}}",
    bodyTemplate: `Hi {{candidate_first_name}},

Following our team debrief, we are thrilled to invite you to a final executive conversation for the {{job_title}} role with our leadership team.

📅 Date: {{interview_date}}
⏰ Time: {{interview_time}} (30 Minutes)
🔗 Meeting Link: {{meeting_link}}
👤 Conversation with: {{interviewer_name}}

This conversation is an informal opportunity to discuss strategic organizational goals, long-term impact, and ensure mutual alignment before we finalize our formal compensation package.

Looking forward to connecting!

Warm regards,

{{sender_name}}
Executive Talent Team · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_verbal_offer",
    orgId: "org_myorganisation",
    name: "Verbal Offer Pre-Alignment & Total Rewards Discussion",
    triggerEvent: "offer",
    subject: "Exciting News: Offer Discussion for {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_first_name}},

We have some wonderful news! On behalf of the entire team at {{company_name}}, we are excited to extend an offer to join us as our {{job_title}}!

The interview panel was unanimous in their excitement about the impact you will have on our mission.

Proposed Compensation Summary:
• Annual Base Salary: {{offer_salary}}
• Proposed Start Date: {{joining_date}}
• Benefits & Equity Package: Comprehensive healthcare, 401(k) match, annual learning stipend, and stock options grant.

I would love to set up a quick 15-minute call today to review the complete package, answer your questions, and discuss next steps.

Please let me know when you are available to chat.

Huge congratulations!

Best,

{{sender_name}}
Director of Talent · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_formal_offer",
    orgId: "org_myorganisation",
    name: "Official Employment Offer Package Extended",
    triggerEvent: "offer",
    subject: "Official Employment Offer: {{job_title}} at {{company_name}}",
    bodyTemplate: `Dear {{candidate_name}},

We are delighted to formally extend this offer of employment for the position of {{job_title}} with {{company_name}}!

Your formal offer letter package has been generated and is ready for your review:

Key Terms:
• Position: {{job_title}}
• Reporting Department: {{department}}
• Primary Work Location: {{work_location}}
• Base Compensation: {{offer_salary}}
• Anticipated Start Date: {{joining_date}}

Please access your formal offer documentation on our secure portal or review the attached PDF document to execute your acceptance.

We could not be more excited about the prospect of having you join our team and building incredible things together!

Sincerely,

{{sender_name}}
Chief People Officer · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_hired_onboarding",
    orgId: "org_myorganisation",
    name: "Official Welcome & Day-1 Onboarding Briefing",
    triggerEvent: "hired",
    subject: "Welcome to {{company_name}}, {{candidate_first_name}}! Day 1 Preparation & Next Steps",
    bodyTemplate: `Hi {{candidate_first_name}},

Welcome to the team! We are thrilled that you have accepted our offer to join {{company_name}} as our new {{job_title}}!

Here is what you need to know as we prepare for your Day 1 ({{joining_date}}):

1. Workstation & Hardware Setup:
Our IT operations team will reach out shortly to confirm your delivery address for your company workstation and peripherals.

2. Onboarding Schedule:
Your first day will kick off at 9:30 AM with our company-wide new hire orientation, followed by a welcome lunch and a sync with your manager.

3. Onboarding Buddy:
You have been paired with an onboarding buddy who will guide you through our systems and make your first weeks smooth and enjoyable.

We are counting down the days until your start date! Welcome aboard!

Warmest regards,

{{sender_name}}
People Operations & Onboarding · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_respectful_rejection",
    orgId: "org_myorganisation",
    name: "Respectful Candidate Rejection with Encouragement",
    triggerEvent: "rejected",
    subject: "Update regarding your application for {{job_title}} at {{company_name}}",
    bodyTemplate: `Dear {{candidate_first_name}},

Thank you so much for your interest in {{company_name}} and for taking the time to speak with our team regarding the {{job_title}} position.

We had the privilege of meeting many talented professionals, which made our decision very difficult. While we were impressed by your background and experience, we have decided to move forward with another candidate whose current expertise more closely aligns with the immediate technical needs of this specific role.

We truly appreciated the time and energy you invested in interviewing with us. With your permission, we would love to keep your profile active in our talent network and reach out if future opportunities match your skillset.

We wish you the very best in your career journey and job search.

Sincerely,

{{sender_name}}
Talent Acquisition Team · {{company_name}}`,
    isActive: true,
  },
  {
    id: "tpl_talent_nurture",
    orgId: "org_myorganisation",
    name: "Talent Community & Future Opportunities Nurture",
    triggerEvent: "talent_pool",
    subject: "Staying in Touch with {{company_name}} Talent Community",
    bodyTemplate: `Hi {{candidate_first_name}},

I hope you are doing well!

We wanted to touch base from {{company_name}}. We are continuing to expand our {{department}} team and recently opened new requisitions that align closely with your background and technical skills.

If you are open to exploring new opportunities or would like to learn about what we are building this quarter, I would love to connect for a casual 15-minute catch-up.

You can view our current open roles anytime at: {{careers_url}}

Wishing you continued success!

Best regards,

{{sender_name}}
Talent Community Lead · {{company_name}}`,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding comprehensive enterprise communication templates...");

  const orgs = await db.select({ id: organizations.id }).from(organizations).limit(1);
  const orgId = orgs[0]?.id || "org_my_organisation";

  for (const tpl of ENTERPRISE_TEMPLATES) {
    const existing = await db
      .select({ id: communicationTemplates.id })
      .from(communicationTemplates)
      .where(eq(communicationTemplates.id, tpl.id))
      .limit(1);

    if (existing[0]) {
      await db
        .update(communicationTemplates)
        .set({
          name: tpl.name,
          triggerEvent: tpl.triggerEvent,
          subject: tpl.subject,
          bodyTemplate: tpl.bodyTemplate,
          isActive: tpl.isActive,
        })
        .where(eq(communicationTemplates.id, tpl.id));
      console.log(`✓ Updated template: ${tpl.name}`);
    } else {
      await db.insert(communicationTemplates).values({
        id: tpl.id,
        orgId: orgId,
        name: tpl.name,
        triggerEvent: tpl.triggerEvent,
        subject: tpl.subject,
        bodyTemplate: tpl.bodyTemplate,
        isActive: tpl.isActive,
        createdAt: new Date(),
      });
      console.log(`+ Created template: ${tpl.name}`);
    }
  }

  console.log("✨ All enterprise communication templates successfully seeded!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
