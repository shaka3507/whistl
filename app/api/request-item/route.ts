import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Create a server-side Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data = await request.json();
    const { channelId, userId, title, description } = data;

    // Validate required fields
    if (!channelId || !userId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId, userId, and title are required' },
        { status: 400 }
      );
    }

    // Insert the requested item
    const { data: requestData, error } = await supabase
      .from('requested_items')
      .insert({
        channel_id: channelId,
        user_id: userId,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'requested',
        created_at: new Date().toISOString(),
      })
      .select('*');

    if (error) {
      console.error('Error creating requested item:', error);
      return NextResponse.json(
        { error: `Failed to create requested item: ${error.message}` },
        { status: 500 }
      );
    }

    // Return success response with the created item
    return NextResponse.json({
      success: true,
      requestedItem: requestData?.[0] || null,
    });
  } catch (error: any) {
    console.error('Error in request-item API:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 