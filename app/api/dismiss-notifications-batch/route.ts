import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageIds, userId } = body;

    // Validate required fields
    if (!Array.isArray(messageIds) || messageIds.length === 0 || !userId) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields', details: 'messageIds must be a non-empty array and userId is required' },
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

    // Process each messageId and create dismissal records
    const dismissalRecords = messageIds.map(messageId => ({
      message_id: messageId,
      user_id: userId,
      dismissed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }));

    // Insert the dismissal records using admin privileges
    const { data, error } = await supabaseAdmin
      .from('message_dismissals')
      .upsert(dismissalRecords, { 
        onConflict: 'message_id,user_id', 
        ignoreDuplicates: true 
      })
      .select();

    if (error) {
      console.error('Error dismissing notifications:', error);
      return NextResponse.json(
        { error: 'Failed to dismiss notifications', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      dismissedCount: messageIds.length,
      data
    });
  } catch (error: any) {
    console.error('Error in dismiss-notifications-batch API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 