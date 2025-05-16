import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId, userId } = body;

    // Validate required fields
    if (!messageId || !userId) {
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

    // Insert the dismissal record using admin privileges
    const { error } = await supabaseAdmin
      .from('message_dismissals')
      .insert({
        message_id: messageId,
        user_id: userId,
        dismissed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error dismissing notification:', error);
      return NextResponse.json(
        { error: 'Failed to dismiss notification', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in dismiss-notification API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 