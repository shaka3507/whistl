## whistl

Emergency preparation application developed for CS 484/584 - Full Stack Web Development.

### Running Locally

To run this application locally:

1. **Prerequisites**
   - Node.js 18+ installed on your machine
   - npm or yarn package manager

2. **Setup**
   - Clone this repository
   - The `.env.local` file is already included in the project root
     - This file contains all necessary credentials:
       - Supabase credentials for database access
       - Mailgun credentials for email notifications
       - API keys for additional services
     - **Important**: No additional setup is required as you'll be connecting to my existing services

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**
   - Open your browser and navigate to [http://localhost:3000](http://localhost:3000)
   - You can either:
     - Create a new account by visiting the signup page
     - When creating an account, check the "Admin Access" checkbox to gain administrative privileges
     - The application has role-based permissions that restrict certain features to admin users only


### Application Structure

The application consists of several key features:

- **Channels**: Communication spaces for emergency coordination
- **Alerts**: Emergency notifications with severity levels
- **Preparation Lists**: Customizable emergency preparation checklists
- **Wellness Checks**: Tools to check on team members during emergencies

### Database Structure

This application uses Supabase as its backend with the following main tables:

- `channels` - Communication spaces for groups
- `messages` - User communications within channels
- `alerts` - Emergency notifications
- `prepare_categories` - Categories of emergencies
- `prepare_template_items` - Template items for each emergency type
- `prepare_lists` - User-created preparation lists
- `prepare_list_items` - Items in a user's preparation list

### Notes for Evaluators

- The application is fully functional with the provided `.env.local` file
- All data is stored in my Supabase instance, so no database setup is required
- Features can be tested using the provided test account or by creating a new account
