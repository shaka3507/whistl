-- Add email_notifications column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT FALSE;

-- Update the profile RLS policies for the new column
CREATE POLICY "Users can update their own email_notifications preference"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id); 