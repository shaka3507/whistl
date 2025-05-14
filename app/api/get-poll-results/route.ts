import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase-types';

// Define a simplified type for the results that ignores the Supabase specific typing issues
type PollResult = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  minValue: number;
  maxValue: number;
  created_by: string;
  stats: {
    total: number;
    average: number;
    distribution: Record<number, number>;
  };
  respondedMembers: Array<{
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    responseValue: number;
    comment: string | null;
    respondedAt: string;
  }>;
  nonRespondedMembers: Array<{
    userId: string;
    fullName: string;
    avatarUrl: string | null;
  }>;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pollId = url.searchParams.get('pollId');
    const channelId = url.searchParams.get('channelId');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required userId parameter' },
        { status: 400 }
      );
    }

    // Need either pollId or channelId
    if (!pollId && !channelId) {
      return NextResponse.json(
        { error: 'Either pollId or channelId is required' },
        { status: 400 }
      );
    }

    // Initialize userProfiles here, before any usage
    let userProfiles: Record<string, any> = {};

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

    // First check if user is an admin of the channel
    const checkChannelId = channelId || (pollId && await getChannelIdFromPoll(supabaseAdmin, pollId));
    
    if (!checkChannelId) {
      return NextResponse.json(
        { error: 'Could not determine channel ID' },
        { status: 400 }
      );
    }

    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('channel_members')
      .select('role')
      .eq('channel_id', checkChannelId)
      .eq('user_id', userId)
      .single();
      
    if (memberError || !memberData) {
      return NextResponse.json(
        { error: 'Not a member of this channel' },
        { status: 403 }
      );
    }

    // Allow non-admin members to view poll results but with limited data
    // This change allows regular members to view poll results
    let polls;
    
    // If pollId is provided, get results for specific poll
    if (pollId) {
      const { data: poll, error: pollError } = await supabaseAdmin
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (pollError) {
        return NextResponse.json(
          { error: 'Failed to fetch poll', details: pollError.message },
          { status: 500 }
        );
      }
      
      polls = [poll];
    } 
    // Otherwise, get all polls for the channel
    else {
      const { data: channelPolls, error: pollsError } = await supabaseAdmin
        .from('polls')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false });
        
      if (pollsError) {
        return NextResponse.json(
          { error: 'Failed to fetch polls', details: pollsError.message },
          { status: 500 }
        );
      }
      
      polls = channelPolls;
    }
    
    if (!polls || polls.length === 0) {
      return NextResponse.json({ polls: [] });
    }

    // Get members in the channel to determine who hasn't responded
    const { data: channelMembers, error: membersError } = await supabaseAdmin
      .from('channel_members')
      .select('user_id')
      .eq('channel_id', checkChannelId);
      
    if (membersError) {
      console.error('Error fetching channel members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch channel members', details: membersError.message },
        { status: 500 }
      );
    }
    
    // Fetch all member profiles at once if not already in the userProfiles map
    if (channelMembers && channelMembers.length > 0) {
      const memberUserIds = channelMembers.map(m => m.user_id);
      const missingUserIds = memberUserIds.filter(id => !userProfiles[id]);
      
      if (missingUserIds.length > 0) {
        const { data: memberProfiles, error: memberProfilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', missingUserIds);
          
        if (memberProfilesError) {
          console.error('Error fetching member profiles:', memberProfilesError);
        } else if (memberProfiles) {
          // Add to our profiles map
          memberProfiles.forEach(profile => {
            userProfiles[profile.id] = profile;
          });
        }
      }
    }

    // Get responses for all polls
    const pollIds = polls.map(poll => poll.id);
    const { data: allResponses, error: responsesError } = await supabaseAdmin
      .from('poll_responses')
      .select(`
        id,
        poll_id,
        user_id,
        response_value,
        comment,
        created_at
      `)
      .in('poll_id', pollIds);
      
    if (responsesError) {
      console.error('Error fetching poll responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch poll responses', details: responsesError.message },
        { status: 500 }
      );
    }

    // If we have responses, fetch all the user profiles for these responses
    if (allResponses && allResponses.length > 0) {
      const userIds = Array.from(new Set(allResponses.map(r => r.user_id)));
      
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        return NextResponse.json(
          { error: 'Failed to fetch user profiles', details: profilesError.message },
          { status: 500 }
        );
      }
      
      // Create a map of user ID to profile for easy lookup
      userProfiles = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);
    }

    // Prepare results with response stats and user details
    const pollResults: PollResult[] = polls.map(poll => {
      // Filter responses for this poll
      const filteredResponses = allResponses?.filter(r => r.poll_id === poll.id) || [];
      
      // Calculate response statistics
      const total = filteredResponses.length;
      const sum = filteredResponses.reduce((acc, r) => acc + r.response_value, 0);
      const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;
      
      // Create distribution object
      const distribution: Record<number, number> = {};
      for (let i = poll.min_value; i <= poll.max_value; i++) {
        distribution[i] = 0;
      }
      
      // Count each value in the distribution
      filteredResponses.forEach(r => {
        distribution[r.response_value] = (distribution[r.response_value] || 0) + 1;
      });
      
      // Responded members details
      const respondedMembers = filteredResponses.map(r => ({
        userId: r.user_id,
        fullName: userProfiles[r.user_id]?.full_name || 'Unknown',
        avatarUrl: userProfiles[r.user_id]?.avatar_url,
        responseValue: r.response_value,
        comment: r.comment,
        respondedAt: r.created_at
      }));
      
      // Get members who have not responded
      const respondedUserIds = new Set(filteredResponses.map(r => r.user_id));
      const nonRespondedMembers = channelMembers
        ?.filter(m => !respondedUserIds.has(m.user_id) && m.user_id !== poll.created_by)
        .map(m => ({
          userId: m.user_id,
          fullName: userProfiles[m.user_id]?.full_name || 'Unknown',
          avatarUrl: userProfiles[m.user_id]?.avatar_url
        })) || [];
      
      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        createdAt: poll.created_at,
        minValue: poll.min_value,
        maxValue: poll.max_value,
        created_by: poll.created_by,
        stats: {
          total,
          average,
          distribution
        },
        respondedMembers,
        nonRespondedMembers
      };
    });

    return NextResponse.json({
      success: true,
      polls: pollResults
    });
  } catch (error: any) {
    console.error('Error in get-poll-results API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// Helper function to get channel ID from a poll ID
async function getChannelIdFromPoll(supabase: any, pollId: string) {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('channel_id')
      .eq('id', pollId)
      .single();
      
    if (error) {
      console.error('Error getting channel ID from poll:', error);
      return null;
    }
    
    return data?.channel_id;
  } catch (err) {
    console.error('Exception getting channel ID from poll:', err);
    return null;
  }
} 