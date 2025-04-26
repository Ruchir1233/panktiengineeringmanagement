CREATE TABLE IF NOT EXISTS "customers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "address" TEXT,
  "email" TEXT,
  "phone_number" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "work_amount" NUMERIC(12, 2) NOT NULL,
  "advance_amount" NUMERIC(12, 2) DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_name ON "customers" ("name");
CREATE INDEX IF NOT EXISTS idx_customers_phone ON "customers" ("phone_number");
CREATE INDEX IF NOT EXISTS idx_customers_location ON "customers" ("location");
