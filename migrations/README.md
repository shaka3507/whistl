# Database Migrations

This directory contains SQL migration scripts for the Whistl application.

## Available Migrations

- `create-avatars-bucket.sql`: Creates a storage bucket for user avatars and sets up the corresponding access policies.

## How to Run Migrations

You can run these migrations through the Supabase dashboard or using the Supabase CLI.

### Using Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you wish to run
4. Paste into the SQL Editor and execute

### Using Supabase CLI

1. Ensure you have the Supabase CLI installed and configured
2. Run the following command:

```bash
supabase db execute --file ./migrations/create-avatars-bucket.sql
```

## Migration Notes

### create-avatars-bucket.sql

This migration:
- Creates a storage bucket named 'avatars' for storing user profile images
- Sets up the following access policies:
  - Anyone can view avatar images (public access)
  - Users can only upload/update/delete their own avatars
- The file path structure for avatars should be: `{user_id}/{timestamp}.{extension}` 