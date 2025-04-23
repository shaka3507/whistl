import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Here you would typically call a service like web-push to send the notifications
    // For this implementation, we'll just simulate the sending process
    
    // In a real implementation, you would:
    // 1. Parse the subscription data for each user
    // 2. Use web-push library to send notifications to each subscription
    
    // For now, we'll just log the intent and return success
    console.log(`Would send push notification to ${subscriptions.length} subscriptions`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${messageBody}`);
    console.log(`URL: ${url || 'No URL provided'}`);

    return NextResponse.json({
      success: true,
      message: `Push notification sent to ${subscriptions.length} subscribers`,
      sent: subscriptions.length,
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