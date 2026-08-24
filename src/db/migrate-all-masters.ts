import { db } from "./index";
import { sql } from "drizzle-orm";
import {
  organizations,
  currencies,
  payFrequencies,
  jobStatuses,
  interviewTypes,
  benefitCategories,
} from "./schema";

async function main() {
  console.log("Migrating Master Taxonomy Tables on PostgreSQL...");

  // 1. Create Currencies table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS currencies (
      id VARCHAR(64) PRIMARY KEY,
      org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code VARCHAR(16) NOT NULL,
      symbol VARCHAR(16) NOT NULL,
      name TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ currencies table verified.");

  // 2. Create Pay Frequencies table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pay_frequencies (
      id VARCHAR(64) PRIMARY KEY,
      org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug VARCHAR(64) NOT NULL,
      description TEXT,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ pay_frequencies table verified.");

  // 3. Create Job Statuses table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS job_statuses (
      id VARCHAR(64) PRIMARY KEY,
      org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug VARCHAR(64) NOT NULL,
      badge_variant VARCHAR(32) DEFAULT 'secondary',
      description TEXT,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ job_statuses table verified.");

  // 4. Create Interview Types table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS interview_types (
      id VARCHAR(64) PRIMARY KEY,
      org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug VARCHAR(64) NOT NULL,
      default_duration_minutes INTEGER NOT NULL DEFAULT 45,
      description TEXT,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ interview_types table verified.");

  // 5. Create Benefit Categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS benefit_categories (
      id VARCHAR(64) PRIMARY KEY,
      org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug VARCHAR(64) NOT NULL,
      description TEXT,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ benefit_categories table verified.");

  // Get primary organization ID
  const orgList = await db.select({ id: organizations.id }).from(organizations).limit(1);
  const orgId = orgList[0]?.id || "org_my_organisation";
  console.log(`Using organization ID: ${orgId}`);

  // Seed standard enterprise Currencies
  const existingCurrencies = await db.select().from(currencies);
  if (existingCurrencies.length === 0) {
    await db.insert(currencies).values([
      { id: "curr_usd", orgId, code: "USD", symbol: "$", name: "US Dollar ($)", isDefault: true },
      { id: "curr_eur", orgId, code: "EUR", symbol: "€", name: "Euro (€)", isDefault: false },
      { id: "curr_gbp", orgId, code: "GBP", symbol: "£", name: "British Pound (£)", isDefault: false },
      { id: "curr_inr", orgId, code: "INR", symbol: "₹", name: "Indian Rupee (₹)", isDefault: false },
      { id: "curr_cad", orgId, code: "CAD", symbol: "C$", name: "Canadian Dollar (C$)", isDefault: false },
      { id: "curr_aud", orgId, code: "AUD", symbol: "A$", name: "Australian Dollar (A$)", isDefault: false },
      { id: "curr_sgd", orgId, code: "SGD", symbol: "S$", name: "Singapore Dollar (S$)", isDefault: false },
      { id: "curr_aed", orgId, code: "AED", symbol: "AED", name: "UAE Dirham (AED)", isDefault: false },
    ]);
    console.log("✓ Seeded 8 standard currencies.");
  }

  // Seed standard enterprise Pay Frequencies
  const existingFrequencies = await db.select().from(payFrequencies);
  if (existingFrequencies.length === 0) {
    await db.insert(payFrequencies).values([
      { id: "freq_annual", orgId, name: "Annual Salary", slug: "annual", description: "Standard annualized total compensation figure", isDefault: true },
      { id: "freq_monthly", orgId, name: "Monthly Salary", slug: "monthly", description: "Monthly fixed remuneration", isDefault: false },
      { id: "freq_hourly", orgId, name: "Hourly Rate", slug: "hourly", description: "Hourly contract / freelance contractor billing rate", isDefault: false },
      { id: "freq_weekly", orgId, name: "Weekly Pay", slug: "weekly", description: "Weekly payroll compensation cycle", isDefault: false },
    ]);
    console.log("✓ Seeded 4 pay frequencies.");
  }

  // Seed standard enterprise Requisition Statuses
  const existingStatuses = await db.select().from(jobStatuses);
  if (existingStatuses.length === 0) {
    await db.insert(jobStatuses).values([
      { id: "status_published", orgId, name: "Published (Live on Careers)", slug: "published", badgeVariant: "soft-success", description: "Active open requisition receiving external applications", isDefault: true },
      { id: "status_draft", orgId, name: "Draft (Internal Only)", slug: "draft", badgeVariant: "secondary", description: "Under review / preparation before public opening", isDefault: false },
      { id: "status_on_hold", orgId, name: "On Hold", slug: "on_hold", badgeVariant: "warning", description: "Temporarily paused hiring pipeline", isDefault: false },
      { id: "status_closed", orgId, name: "Closed / Filled", slug: "closed", badgeVariant: "destructive", description: "Requisition closed after candidate hire", isDefault: false },
      { id: "status_archived", orgId, name: "Archived", slug: "archived", badgeVariant: "outline", description: "Historical past requisition", isDefault: false },
    ]);
    console.log("✓ Seeded 5 requisition statuses.");
  }

  // Seed standard enterprise Interview Types
  const existingInterviewTypes = await db.select().from(interviewTypes);
  if (existingInterviewTypes.length === 0) {
    await db.insert(interviewTypes).values([
      { id: "itype_screening", orgId, name: "Initial Recruiter Screening", slug: "screening", defaultDurationMinutes: 30, description: "Candidate introduction, background, and alignment screen", isDefault: true },
      { id: "itype_technical", orgId, name: "Technical Architecture & System Design", slug: "technical", defaultDurationMinutes: 60, description: "In-depth engineering and domain problem solving", isDefault: false },
      { id: "itype_coding", orgId, name: "Live Coding & Algorithm Assessment", slug: "coding", defaultDurationMinutes: 60, description: "Hands-on paired coding session", isDefault: false },
      { id: "itype_culture", orgId, name: "Culture & Values Alignment", slug: "culture", defaultDurationMinutes: 45, description: "Cross-functional collaboration and team values assessment", isDefault: false },
      { id: "itype_executive", orgId, name: "Executive Leadership Final", slug: "executive", defaultDurationMinutes: 45, description: "Final discussion with leadership / VP / Founder", isDefault: false },
    ]);
    console.log("✓ Seeded 5 interview round types.");
  }

  // Seed standard enterprise Benefit Categories
  const existingBenefitCats = await db.select().from(benefitCategories);
  if (existingBenefitCats.length === 0) {
    await db.insert(benefitCategories).values([
      { id: "bcat_health", orgId, name: "Healthcare & Wellness", slug: "health", description: "Medical, dental, vision, mental health, and wellness programs", isDefault: true },
      { id: "bcat_financial", orgId, name: "Retirement & Wealth", slug: "financial", description: "401(k) match, equity plans, stock options, and pension", isDefault: false },
      { id: "bcat_timeoff", orgId, name: "Time Off & Leave", slug: "time_off", description: "Flexible PTO, parental leave, and company holidays", isDefault: false },
      { id: "bcat_learning", orgId, name: "Growth & Learning", slug: "learning", description: "Conferences, books, tuition reimbursements, and courses", isDefault: false },
      { id: "bcat_lifestyle", orgId, name: "Perks & Remote Support", slug: "lifestyle", description: "Home office budget, meal stipends, retreats, and equipment", isDefault: false },
    ]);
    console.log("✓ Seeded 5 benefit categories.");
  }

  console.log("All Master Taxonomy tables successfully created and seeded!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
