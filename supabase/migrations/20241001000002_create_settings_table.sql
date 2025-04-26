
CREATE TABLE IF NOT EXISTS "settings" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert the default PIN for login
INSERT INTO "settings" ("key", "value") 
VALUES ('pin', '1298') 
ON CONFLICT ("key") DO UPDATE SET "value" = '1298', "updated_at" = now();
