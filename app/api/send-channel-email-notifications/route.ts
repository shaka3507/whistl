import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import type { Database } from '@/lib/supabase-types';

// Get environment variables
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://whistl.vercel.app'
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelId, subject, text, excludeUserId } = body;

    // Validate required fields
    if (!channelId || !subject || !text) {
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

    // Get channel details
    const { data: channel, error: channelError } = await supabaseAdmin
      .from('channels')
      .select('id, name, description')
      .eq('id', channelId)
      .single();

    if (channelError) {
      console.error('Error fetching channel:', channelError);
      return NextResponse.json(
        { error: 'Failed to fetch channel details', details: channelError.message },
        { status: 500 }
      );
    }

    // Get all channel members with email notifications enabled
    const { data: members, error: membersError } = await supabaseAdmin
      .from('channel_members')
      .select(`
        user_id,
        profiles:user_id (
          id,
          email_notifications
        )
      `)
      .eq('channel_id', channelId)
      .not('user_id', 'eq', excludeUserId || '');

    if (membersError) {
      console.error('Error fetching channel members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch channel members', details: membersError.message },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { message: 'No members found in this channel' },
        { status: 200 }
      );
    }

    // Filter members who have email notifications enabled
    const usersWithNotifications = members.filter(
      member => member.profiles?.email_notifications
    );

    if (usersWithNotifications.length === 0) {
      return NextResponse.json({
        message: 'No channel members with email notifications enabled',
        sent: 0,
        total: members.length
      });
    }

    // Get email addresses for all users with notifications enabled
    const userIds = usersWithNotifications.map(member => member.user_id);
    const { data: users, error: usersError } = await supabaseAdmin
      .from('auth')
      .select('id, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching user emails:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user emails', details: usersError.message },
        { status: 500 }
      );
    }

    // No Mailgun configuration, log instead of sending
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.log('Mailgun not configured. Would send notifications to:', users);
      return NextResponse.json({
        message: 'Mailgun not configured, no emails sent',
        would_send_to: users.length,
        total: members.length
      });
    }

    // Send emails to all users with email notifications enabled
    const channelLink = `${APP_URL}/channels/${channelId}`;
    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          await sendEmail(
            user.email,
            `${subject} - Whistl Channel: ${channel.name}`,
            `${text}\n\nClick here to view the channel: ${channelLink}`
          );
          return { success: true, userId: user.id };
        } catch (error) {
          console.error('Error sending email to', user.email, ':', error);
          return { success: false, error, userId: user.id };
        }
      })
    );

    // Count successful and failed emails
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Email notifications sent to ${successful} users (${failed} failed)`,
      sent: successful,
      failed: failed,
      total: members.length
    });
  } catch (error: any) {
    console.error('Error in send-channel-email-notifications API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}

async function sendEmail(to: string, subject: string, text: string) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('Mailgun API key or domain not configured');
    return;
  }

  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  const auth = `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`;

  const response = await axios.post(
    url,
    new URLSearchParams({
      from: `Whistl <mailgun@${MAILGUN_DOMAIN}>`,
      to,
      subject,
      text,
    }),
    {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
} 