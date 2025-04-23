# Push Notifications Implementation Guide

This guide explains how to set up and use push notifications in your Whistl application using Supabase Edge Functions and the Web Push API.

## Installation

1. Install required packages:

```bash
npm install web-push --save
```

2. Create the push_subscriptions table in Supabase:

Run the SQL in `supabase/migrations/20240701000000_push_notifications.sql` or execute it manually in the Supabase SQL editor.

3. Set up environment variables:

Add these to your `.env.local` file:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMR_S873mOj37k8T-je1GF-WDgvvnUfH7rfGslAJrZwEi1rF9NzP3HRuGQG07oLc7MRmZH8jF2p-kzpTPQeyF7Y
VAPID_PRIVATE_KEY=Ry5gvadVpruLlYXZedqtS55j5RyLR9BWuk1YCFw5kHM
VAPID_EMAIL=your-email@example.com
```

4. Deploy the Supabase Edge Function:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy push-notifications --project-ref YOUR_PROJECT_REF

# Set environment variables
supabase secrets set VAPID_PUBLIC_KEY="BMR_S873mOj37k8T-je1GF-WDgvvnUfH7rfGslAJrZwEi1rF9NzP3HRuGQG07oLc7MRmZH8jF2p-kzpTPQeyF7Y" --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_PRIVATE_KEY="Ry5gvadVpruLlYXZedqtS55j5RyLR9BWuk1YCFw5kHM" --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_EMAIL="your-email@example.com" --project-ref YOUR_PROJECT_REF
```

## How It Works

### User Subscription Flow

1. User clicks the "Enable Notifications" button in the UI
2. Browser requests notification permission
3. If granted, a subscription is created and saved to Supabase
4. User will now receive push notifications

### Sending Notifications

When an admin sends a push notification:

1. The message is saved to the database with `notification_type: 'push'`
2. The API route `/api/send-push-notification` is called
3. The API route invokes the Supabase Edge Function
4. The Edge Function fetches all subscriptions for channel members
5. Notifications are sent to all subscribed users
6. Service worker displays the notification even when browser is closed

### Testing

To test push notifications:

1. Use Chrome or Firefox (Safari has limited support)
2. Enable notifications when prompted
3. Have an admin send a push notification
4. Verify it appears as a system notification

## Troubleshooting

- **Notifications not appearing**: Check browser console for errors. Ensure the service worker is registered properly.
- **Permission denied**: User must manually enable notifications in browser settings.
- **Edge Function errors**: Check Supabase logs for detailed error messages.

## Security Considerations

- VAPID keys secure your push notification service
- Environment variables protect your private keys
- Supabase RLS policies ensure users can only manage their own subscriptions 