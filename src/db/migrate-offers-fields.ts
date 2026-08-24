import { sql } from "drizzle-orm";
import { db } from "./index";

async function main() {
  console.log("Adding enterprise columns to offers table...");

  await db.execute(sql`
    ALTER TABLE offers 
    ADD COLUMN IF NOT EXISTS grade_level text,
    ADD COLUMN IF NOT EXISTS pay_frequency varchar(32) DEFAULT 'annual' NOT NULL,
    ADD COLUMN IF NOT EXISTS sign_on_bonus integer,
    ADD COLUMN IF NOT EXISTS annual_bonus text,
    ADD COLUMN IF NOT EXISTS equity_shares text,
    ADD COLUMN IF NOT EXISTS probation_period text,
    ADD COLUMN IF NOT EXISTS notice_period text,
    ADD COLUMN IF NOT EXISTS template_type varchar(64) DEFAULT 'standard' NOT NULL,
    ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '[]'::jsonb;
  `);

  console.log("Enterprise offer columns successfully added to database!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
