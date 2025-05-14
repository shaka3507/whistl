## whistl

Emergency preparation application developed for CS 484/584 - Full Stack Web Development.

### Running Locally

To run this application locally:

1. **Prerequisites**
   - Node.js 20.12.2 or later installed on your machine (as specified in `.nvmrc`)
   - npm or yarn package manager
   - nvm (Node Version Manager) installed

2. **Setup**
   - Clone this repository
   - The `.env.local` file is already included in the project root
     - This file contains all necessary credentials:
       - Supabase credentials for database access
       - Mailgun credentials for email notifications
       - API keys for additional services
     - **Important**: No additional setup is required as you'll be connecting to my existing services

3. **Quick Start**
   ```bash
   # Use the correct Node.js version, install dependencies, and start the dev server in one command
   nvm use && npm i && npm run dev
   ```

   Or if you prefer the step-by-step approach:

   ```bash
   # Set the correct Node.js version
   nvm use
   
   # Install dependencies
   npm install
   # or
   yarn install
   
   # Start the development server
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application**
   - Open your browser and navigate to [http://localhost:3000](http://localhost:3000)
   - You can either:
     - Create a new account by visiting the signup page
     - When creating an account, check the "Admin Access" checkbox to gain administrative privileges
     - The application has role-based permissions that restrict certain features to admin users only

5. **Styleguide**
   - A comprehensive styleguide is available at [http://localhost:3000/styleguide](http://localhost:3000/styleguide)
   - The styleguide showcases all UI components and design patterns used throughout the application
   - Use this as a reference when developing new features to maintain design consistency


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
