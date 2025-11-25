CREATE TABLE IF NOT EXISTS "attendance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "attendance_type" TEXT NOT NULL CHECK (attendance_type IN ('full_day', 'half_day', 'hourly', 'absent')),
  "hours" NUMERIC(4, 2),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON "attendance" ("employee_id");
CREATE INDEX IF NOT EXISTS idx_attendance_date ON "attendance" ("date");
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON "attendance" ("employee_id", "date");

