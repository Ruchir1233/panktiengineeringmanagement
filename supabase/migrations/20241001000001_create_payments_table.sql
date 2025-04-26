CREATE TABLE IF NOT EXISTS "transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL REFERENCES "customers" ("id") ON DELETE CASCADE,
  "amount" NUMERIC(12, 2) NOT NULL,
  "payment_mode" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON "transactions" ("customer_id");
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON "transactions" ("created_at");
