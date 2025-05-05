import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase-types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      pollId, 
      userId,
      responseValue,
      comment
    } = body;

    // Validate required fields
    if (!pollId || !userId || responseValue === undefined) {
      console.log("Missing required fields:", { pollId, userId, responseValue });
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

    // Get poll details to check if the response is within range
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) {
      console.error('Error fetching poll:', pollError, { pollId });
      return NextResponse.json(
        { error: 'Failed to fetch poll', details: pollError.message },
        { status: 500 }
      );
    }

    // Verify response value is within the poll's range
    if (responseValue < poll.min_value || responseValue > poll.max_value) {
      console.log(`Response value ${responseValue} out of range (${poll.min_value}-${poll.max_value})`);
      return NextResponse.json(
        { 
          error: `Response value must be between ${poll.min_value} and ${poll.max_value}` 
        },
        { status: 400 }
      );
    }

    // Check if user is a member of the channel
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('channel_members')
      .select('*')
      .eq('channel_id', poll.channel_id)
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error checking channel membership:', memberError, { channelId: poll.channel_id, userId });
    }
    
    if (!memberData || memberData.length === 0) {
      console.log('User is not a member of the channel', { channelId: poll.channel_id, userId });
      return NextResponse.json(
        { error: 'Not authorized to respond to this poll' },
        { status: 403 }
      );
    }

    // Check if user has already responded to this poll
    const { data: existingResponse, error: responseCheckError } = await supabaseAdmin
      .from('poll_responses')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (responseCheckError) {
      console.error('Error checking existing responses:', responseCheckError, { pollId, userId });
    }

    let pollResponse;

    try {
      if (existingResponse) {
        // Update existing response
        const { data: updatedResponse, error: updateError } = await supabaseAdmin
          .from('poll_responses')
          .update({
            response_value: responseValue,
            comment: comment || null
          })
          .eq('id', existingResponse.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating poll response:', updateError, { responseId: existingResponse.id });
          throw updateError;
        }

        pollResponse = updatedResponse;
        console.log('Successfully updated poll response', { responseId: existingResponse.id });
      } else {
        // Create new response
        const { data: newResponse, error: createError } = await supabaseAdmin
          .from('poll_responses')
          .insert({
            poll_id: pollId,
            user_id: userId,
            response_value: responseValue,
            comment: comment || null
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating poll response:', createError, { pollId, userId });
          throw createError;
        }

        pollResponse = newResponse;
        console.log('Successfully created poll response', { responseId: newResponse.id });
      }
    } catch (dbError: any) {
      return NextResponse.json(
        { 
          error: 'Database operation failed', 
          details: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pollResponse
    });
  } catch (error: any) {
    console.error('Error in respond-to-poll API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 