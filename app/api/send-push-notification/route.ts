import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// VAPID keys for web push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BMR_S873mOj37k8T-je1GF-WDgvvnUfH7rfGslAJrZwEi1rF9NzP3HRuGQG07oLc7MRmZH8jF2p-kzpTPQeyF7Y';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Ry5gvadVpruLlYXZedqtS55j5RyLR9BWuk1YCFw5kHM';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'your-email@example.com';

// Configure web-push with VAPID details
webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelId, title, messageBody, url } = body;

    // Validate required fields
    if (!channelId || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a Supabase admin client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - missing environment variables' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all channel members to send notifications to
    const { data: channelMembers, error: membersError } = await supabaseAdmin
      .from('channel_members')
      .select('user_id')
      .eq('channel_id', channelId);

    if (membersError) {
      console.error('Error fetching channel members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch channel members', details: membersError.message },
        { status: 500 }
      );
    }

    if (!channelMembers || channelMembers.length === 0) {
      return NextResponse.json(
        { error: 'No members found in this channel' },
        { status: 404 }
      );
    }

    // Get subscription records for all channel members
    const userIds = channelMembers.map(member => member.user_id);
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subscriptionsError) {
      console.error('Error fetching push subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch push subscriptions', details: subscriptionsError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        message: 'No push subscriptions found for channel members',
        sent: 0,
        total: userIds.length
      });
    }

    console.log(`Sending push notification to ${subscriptions.length} subscriptions`);
    
    // Prepare the notification payload
    const notificationPayload = JSON.stringify({
      title: title,
      body: messageBody,
      url: url || '/',
      tag: 'notification'
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const parsedSubscription = JSON.parse(sub.subscription);
          await webpush.sendNotification(
            parsedSubscription,
            notificationPayload
          );
          return { success: true, userId: sub.user_id };
        } catch (error) {
          console.error('Error sending notification:', error);
          return { success: false, error, userId: sub.user_id };
        }
      })
    );

    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Push notification sent to ${successful} subscribers (${failed} failed)`,
      sent: successful,
      failed: failed,
      total: userIds.length
    });
  } catch (error: any) {
    console.error('Error in send-push-notification API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 