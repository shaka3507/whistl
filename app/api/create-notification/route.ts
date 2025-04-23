import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      channelId, 
      userId, 
      content, 
      isNotification = true, 
      notificationType 
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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    console.error('Error in create-notification API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 