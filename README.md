## whistl

The Emergency Preparedness feature allows users to:

1. Browse categories of emergencies (e.g., Earthquake, Tsunami, Wildfire)
2. See recommended items for each emergency type
3. Create personalized preparation lists with custom quantities
4. Save and manage their preparation lists
5. (Coming soon) Share lists with channels and allow members to claim items

### Database Structure

This feature uses the following database tables:

- `prepare_categories` - Categories of emergencies
- `prepare_template_items` - Template items for each emergency type
- `prepare_lists` - User-created preparation lists
- `prepare_list_items` - Items in a user's preparation list

### Setup Instructions

To set up the feature:

1. Execute the SQL schema in `app/prepare/schema.sql` to create the necessary tables
2. Run the seed script to populate the database with categories and template items:

```bash
cd app/prepare
node prepare-setup.js
```

### Implementation Status

The backend database structure and seed data are complete. The frontend UI has been designed but needs implementation. 
