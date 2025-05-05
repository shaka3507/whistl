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
        notification_type: notificationType
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

    // Optionally send email notifications
    let emailResult = null;
    if (sendEmailNotifications) {
      try {
        // Get channel details for the email
        const { data: channel } = await supabaseAdmin
          .from('channels')
          .select('name')
          .eq('id', channelId)
          .single();
          
        // Don't wait for the email API call to complete
        emailResult = axios.post('/api/send-channel-email-notifications', {
          channelId,
          subject: 'New Notification in Channel',
          text: content,
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
      message: data,
      emailNotifications: sendEmailNotifications ? 'queued' : 'skipped'
    });
  } catch (error: any) {
    console.error('Error in create-notification API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 