import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase-types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId } = body;

    // Validate required fields
    if (!messageId) {
      return NextResponse.json(
        { error: 'Missing required field: messageId' },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert the acknowledgment
    const { error } = await supabase
      .from('message_dismissals')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        dismissed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error acknowledging notification:', error);
      return NextResponse.json(
        { error: 'Failed to acknowledge notification', details: error.message },
        { status: 500 }
      );
    }

    // Update the message to mark as acknowledged by this user
    return NextResponse.json({
      success: true,
      message: 'Notification acknowledged successfully'
    });
  } catch (error: any) {
    console.error('Error processing acknowledgment:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
} 