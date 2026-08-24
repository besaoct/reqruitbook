import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  console.log("Applying schema updates for candidate fields (experience, company, notice, salary, linkedin, portfolio, resume, cover letter)...");

  await pool.query(`
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "current_company" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "total_experience_years" integer DEFAULT 0;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "total_experience_text" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "expected_salary" integer DEFAULT 0;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "expected_salary_text" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "notice_period_days" integer DEFAULT 30;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "notice_period_text" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "linkedin_url" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "portfolio_url" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "resume_url" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "resume_file_name" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "cover_letter" text;
  `);

  console.log("✓ Candidate fields schema migration completed successfully!");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
