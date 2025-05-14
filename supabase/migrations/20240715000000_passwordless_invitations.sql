-- Add is_passwordless column to invitations table
ALTER TABLE "public"."invitations" 
ADD COLUMN IF NOT EXISTS "is_passwordless" BOOLEAN DEFAULT false;

-- Update RLS policies to reflect the new column
ALTER POLICY "Enable read access for authenticated users" ON "public"."invitations"
USING (auth.role() = 'authenticated');

-- Add comment to the column for documentation
COMMENT ON COLUMN "public"."invitations"."is_passwordless" IS 'Indicates if this invitation was sent using the passwordless email feature'; 