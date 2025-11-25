CREATE TABLE IF NOT EXISTS ""employee_advances"" (
  ""id"" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ""employee_id"" UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  ""amount"" NUMERIC(12, 2) NOT NULL,
  ""transaction_type"" TEXT NOT NULL,
  ""date"" DATE NOT NULL,
  ""notes"" TEXT,
  ""created_at"" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ""user_id"" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

CREATE INDEX IF NOT EXISTS idx_employee_advances_employee ON ""employee_advances"" (""employee_id"");
CREATE INDEX IF NOT EXISTS idx_employee_advances_date ON ""employee_advances"" (""date"");
