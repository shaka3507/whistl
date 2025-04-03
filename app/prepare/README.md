# Emergency Preparedness Feature

This directory contains the code for the Emergency Preparedness feature of the Whistl application. This feature allows users to:

1. View different emergency categories (Earthquake, Tsunami, etc.)
2. Select a category to see recommended preparedness items
3. Create personalized preparation lists with custom quantities
4. Save and manage their preparation lists
5. (Coming soon) Share lists with channel members and allow them to claim items

## Database Structure

The feature uses four main tables in the Supabase database:

1. `prepare_categories` - Categories of emergencies (Earthquake, Tsunami, etc.)
2. `prepare_template_items` - Template items recommended for each category
3. `prepare_lists` - User-created preparation lists
4. `prepare_list_items` - Individual items in a user's preparation list

## Setup

To set up the feature, follow these steps:

1. Make sure your Supabase project is set up and running
2. Run the setup script to create tables and seed data:

```bash
cd app/prepare
node prepare-setup.js
```

This will:
- Create the necessary database tables
- Set up Row Level Security policies
- Seed the database with emergency categories
- Seed the database with recommended items for each category

## Implementation Details

- `page.tsx` - The main React component for the Prepare page
- `schema.sql` - SQL schema for creating tables and policies
- `seed-data.sql` - SQL for seeding categories and template items
- `prepare-setup.js` - Script to execute SQL and set up the feature

## Row Level Security

The tables use Supabase Row Level Security (RLS) policies:

- Anyone can read categories and template items
- Only admins can modify categories and template items
- Users can create, read, update, and delete their own preparation lists
- Users can only view shared lists that have been explicitly shared with them

## Adding New Categories

To add a new emergency category or template items, you can either:

1. Update the `seed-data.sql` file and re-run the setup script
2. Use the Supabase dashboard to add entries directly to the tables

## Future Enhancements

Planned features include:

- Sharing lists with channels
- Claiming items from shared lists
- Notifications when items are claimed
- Progress tracking for preparation completeness
- Seasonal recommendations based on local risk factors 