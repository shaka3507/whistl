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
    const { to, subject, text, channelId, channelName } = body;

    // Validate required fields
    if (!to || !subject || !text || !channelId) {
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

    // Check if the user has email notifications enabled
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email_notifications')
      .eq('id', to)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile.email_notifications) {
      return NextResponse.json({
        message: 'User has email notifications disabled',
        sent: false
      });
    }

    // Get user's email address
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth')
      .select('email')
      .eq('id', to)
      .single();

    if (userError) {
      console.error('Error fetching user email:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user email', details: userError.message },
        { status: 500 }
      );
    }

    // If no Mailgun configuration, just log
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.log('Mailgun not configured. Would send notification to:', user.email);
      return NextResponse.json({
        message: 'Mailgun not configured, no email sent',
        would_send_to: user.email
      });
    }

    // Get channel name if not provided
    let channel = channelName;
    if (!channel) {
      const { data: channelData, error: channelError } = await supabaseAdmin
        .from('channels')
        .select('name')
        .eq('id', channelId)
        .single();

      if (channelError) {
        console.error('Error fetching channel name:', channelError);
      } else {
        channel = channelData.name;
      }
    }

    // Add channel link to the email text
    const channelLink = `${APP_URL}/channels/${channelId}`;
    const emailText = `${text}\n\nClick here to view the channel: ${channelLink}`;
    const emailSubject = channel ? `${subject} - Whistl Channel: ${channel}` : subject;

    // Send the email
    try {
      const emailResult = await sendEmail(
        user.email,
        emailSubject,
        emailText
      );

      return NextResponse.json({
        success: true,
        message: 'Email notification sent successfully',
        sent: true
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in send-email-notification API route:', error);
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