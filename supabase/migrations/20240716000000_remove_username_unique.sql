-- Migration to remove the unique constraint from the username field in profiles table

-- Drop the unique constraint from the username column
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Add a comment to document the change
COMMENT ON COLUMN public.profiles.username IS 'Username field - uniqueness constraint removed as of 2024-07-16'; 