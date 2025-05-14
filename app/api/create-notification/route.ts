import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import type { Database } from '@/lib/supabase-types';

// App URL for links in notifications
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://whistl.vercel.app'
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      channelId, 
      userId, 
      content, 
      isNotification = true, 
      notificationType,
      requiresAcknowledgment = notificationType === 'push', // Default to true for push notifications
      sendEmailNotifications = true // Add flag to control email notifications
    } = body;

    // Validate required fields
    if (!channelId || !userId || !content) {
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

    // Insert the message using admin privileges
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content: content,
        is_notification: isNotification,
        notification_type: notificationType,
        requires_acknowledgment: requiresAcknowledgment
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      );
    }

    // If it's a push notification, send it to all channel members
    if (notificationType === 'push') {
      try {
        const response = await axios.post(`${APP_URL}/api/send-push-notification`, {
          channelId: channelId,
          title: 'Notification',
          messageBody: content,
          messageId: data.id,
          url: `/channels/${channelId}?notification=${data.id}`,
          senderId: userId,
          requiresAcknowledgment: requiresAcknowledgment
        });
        
        console.log('Push notification sent:', response.data);
      } catch (error) {
        console.error('Error sending push notification:', error);
        // Continue even if push notification fails
      }
    }

    // Send email notifications if requested
    if (sendEmailNotifications) {
      try {
        const response = await axios.post(`${APP_URL}/api/send-channel-email-notifications`, {
          channelId: channelId,
          senderId: userId,
          message: content,
          type: 'notification',
          notificationId: data.id
        });
        
        console.log('Email notifications sent:', response.data);
      } catch (error) {
        console.error('Error sending email notifications:', error);
        // Continue even if email sending fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification: data
    });
  } catch (error: any) {
    console.error('Error in create-notification API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
} 