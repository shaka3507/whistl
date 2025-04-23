// Supabase Edge Function for sending push notifications
// Follow these steps to deploy:
// 1. npm install -g supabase
// 2. supabase login
// 3. supabase functions deploy push-notifications --project-ref YOUR_PROJECT_REF

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as webPush from 'https://esm.sh/web-push@3.6.1';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BMR_S873mOj37k8T-je1GF-WDgvvnUfH7rfGslAJrZwEi1rF9NzP3HRuGQG07oLc7MRmZH8jF2p-kzpTPQeyF7Y';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'Ry5gvadVpruLlYXZedqtS55j5RyLR9BWuk1YCFw5kHM';
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'your-email@example.com';

interface PushNotificationPayload {
  userId?: string;
  userIds?: string[];
  channelId?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

// Configure web-push with VAPID details
webPush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req: Request) => {
  // Check if it's a POST request
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload: PushNotificationPayload = await req.json();

    // Validate payload
    if ((!payload.userId && !payload.userIds && !payload.channelId) || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    let subscriptions = [];

    // Get subscriptions based on parameters
    if (payload.userId) {
      // Single user
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', payload.userId);

      if (error) throw error;
      subscriptions = data || [];
    } 
    else if (payload.userIds && payload.userIds.length > 0) {
      // Multiple users
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', payload.userIds);

      if (error) throw error;
      subscriptions = data || [];
    }
    else if (payload.channelId) {
      // All users in a channel
      const { data: members, error: membersError } = await supabaseClient
        .from('channel_members')
        .select('user_id')
        .eq('channel_id', payload.channelId);

      if (membersError) throw membersError;

      if (members && members.length > 0) {
        const userIds = members.map(member => member.user_id);
        
        const { data, error } = await supabaseClient
          .from('push_subscriptions')
          .select('subscription')
          .in('user_id', userIds);

        if (error) throw error;
        subscriptions = data || [];
      }
    }

    // If no subscriptions found
    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No active subscriptions found' }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      tag: payload.tag,
      renotify: payload.renotify,
      actions: payload.actions
    };

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const parsedSubscription = JSON.parse(sub.subscription);
          await webPush.sendNotification(
            parsedSubscription,
            JSON.stringify(notificationPayload)
          );
          return { success: true };
        } catch (error) {
          console.error('Error sending notification:', error);
          return { success: false, error };
        }
      })
    );

    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed: failed,
        total: results.length
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to create a Supabase client
function createClient(supabaseUrl: string, supabaseKey: string, options = {}) {
  return {
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          async single() {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`, {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
              },
            });
            const data = await response.json();
            return { data: data.length > 0 ? data[0] : null, error: null };
          },
          async get() {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
              },
            });
            const data = await response.json();
            return { data, error: null };
          }
        }),
        in: (column: string, values: any[]) => ({
          async get() {
            const valuesStr = values.join(',');
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=in.(${valuesStr})`, {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
              },
            });
            const data = await response.json();
            return { data, error: null };
          }
        })
      })
    })
  };
} 