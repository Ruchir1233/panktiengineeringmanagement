CREATE TABLE IF NOT EXISTS "employees" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "phone_number" TEXT,
  "address" TEXT,
  "daily_wage" NUMERIC(12, 2) NOT NULL,
  "overtime_rate" NUMERIC(4, 2) DEFAULT 1.5,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_employees_name ON "employees" ("name");
CREATE INDEX IF NOT EXISTS idx_employees_phone ON "employees" ("phone_number");

