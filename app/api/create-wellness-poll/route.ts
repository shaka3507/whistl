import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase-types';
import webpush from 'web-push';
import axios from 'axios';

// App URL for links in notifications
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://whistl.vercel.app'
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
    const { 
      channelId, 
      userId,
      title, 
      description,
      minValue = 1,
      maxValue = 5,
      sendPushNotification = true,
      sendEmailNotification = true
    } = body;

    // Validate required fields
    if (!channelId || !userId || !title) {
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
    
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Check if user is an admin of the channel
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (memberError || !memberData || memberData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to create polls in this channel' },
        { status: 403 }
      );
    }

    // Get user profile for notification message
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const adminName = userProfile?.full_name || 'An admin';

    // Get channel name
    const { data: channel } = await supabaseAdmin
      .from('channels')
      .select('name')
      .eq('id', channelId)
      .single();

    const channelName = channel?.name || 'a channel';

    // Create the poll
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .insert({
        channel_id: channelId,
        created_by: userId,
        title,
        description,
        poll_type: 'wellness',
        min_value: minValue,
        max_value: maxValue
      })
      .select()
      .single();

    if (pollError) {
      console.error('Error creating poll:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll', details: pollError.message },
        { status: 500 }
      );
    }

    // Create a notification message
    const notificationContent = `${adminName} created a new wellness check poll: ${title}`;
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content: notificationContent,
        is_notification: true,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating notification message:', messageError);
      // Continue execution even if message creation fails
    }

    // If sendPushNotification is true, send push notifications to all channel members
    if (sendPushNotification) {
      try {
        // Get all channel members
        const { data: channelMembers, error: membersError } = await supabaseAdmin
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channelId);

        if (membersError) {
          console.error('Error fetching channel members:', membersError);
        } else if (channelMembers && channelMembers.length > 0) {
          // Get subscription records for all channel members
          const userIds = channelMembers.map(member => member.user_id);
          const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

          if (subscriptionsError) {
            console.error('Error fetching push subscriptions:', subscriptionsError);
          } else if (subscriptions && subscriptions.length > 0) {
            console.log(`Sending push notification to ${subscriptions.length} subscriptions`);
            
            // Prepare the notification payload
            const notificationPayload = JSON.stringify({
              title: `Wellness Check: ${title}`,
              body: description || 'Please respond to this wellness check poll',
              url: `/channels/${channelId}?poll=${poll.id}`,
              tag: `poll-${poll.id}`
            });

            // Send notifications to all subscriptions
            await Promise.allSettled(
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
          }
        }
      } catch (pushError) {
        console.error('Error sending push notifications:', pushError);
        // Continue execution even if push notification fails
      }
    }

    // If sendEmailNotification is true, send email notifications to channel members
    let emailNotificationResult = null;
    if (sendEmailNotification) {
      try {
        // Create the poll link
        const pollLink = `${APP_URL}/channels/${channelId}?poll=${poll.id}`;
        
        // Prepare email text
        const emailText = `${adminName} created a new wellness check poll in channel "${channelName}": ${title}\n\n${description || ''}\n\nPlease respond to this wellness check: ${pollLink}`;
        
        // Send email notifications (don't await to avoid blocking response)
        emailNotificationResult = axios.post('/api/send-channel-email-notifications', {
          channelId,
          subject: `New Wellness Check Poll in ${channelName}`,
          text: emailText,
          excludeUserId: userId // Don't send to the creator
        }).catch(error => {
          console.error('Error sending email notifications:', error);
          return { error: true, message: error.message };
        });
      } catch (emailError) {
        console.error('Error preparing email notifications:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      poll,
      message,
      notifications: {
        push: sendPushNotification ? 'sent' : 'skipped',
        email: sendEmailNotification ? 'queued' : 'skipped'
      }
    });
  } catch (error: any) {
    console.error('Error in create-wellness-poll API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 