# Prepare Library

This directory contains the prepare library component of the application, which provides educational content about disaster preparedness.

## Structure

- `page.tsx` - The main prepare library page that lists all available topics
- `[slug]/page.tsx` - Dynamic route handler for all individual topics
- `../public/data/prepare/*.json` - JSON data files for each topic

## Adding or Modifying Topics

### 1. Update the Topic List

To add a new topic to the library, edit the `allCards` array in `page.tsx`:

```javascript
const allCards: CardData[] = [
  { id: "new-topic", title: "New Topic Title", href: "/prepare/new-topic" },
  // ... existing topics
]
```

### 2. Create the JSON Data File

Create a new JSON file in the `public/data/prepare` directory with the same ID as your topic:

```
public/data/prepare/new-topic.json
```

The JSON file should follow this structure:

```json
{
  "title": "Topic Title",
  "description": "Short description of the topic",
  "sections": [
    {
      "title": "Section Title",
      "content": "Markdown-formatted content for this section"
    },
    // More sections...
  ],
  "resources": [
    {
      "title": "Resource Title",
      "url": "https://example.com/resource"
    },
    // More resources...
  ]
}
```

### 3. Generating Placeholder Files

You can use the script to generate placeholder JSON files for all topics:

```
node scripts/generate-prepare-json.js
```

This will create JSON files for any topics that don't already have them.

## Markdown Support

The content in each section supports Markdown formatting, including:

- Headers (## for h2, ### for h3, etc.)
- Lists (- or * for bullet points, 1. for numbered lists)
- **Bold** and *italic* text
- [Links](https://example.com)
- Code blocks
- And more

## Sections

Each topic should generally have at least these sections:

1. Before the Disaster/Event
2. During the Disaster/Event
3. After the Disaster/Event

Additional sections can be added as needed.

# Emergency Preparedness Feature

tktk

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