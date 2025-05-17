import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase-types';
import crypto from 'crypto';

// Get these from environment variables
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://whistl.vercel.app'
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with the service role key
const adminSupabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request: Request) {
  try {
    // Get request body first
    const { email, channelId, userId } = await request.json();
    
    if (!email || !channelId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Processing invitation request:');
    console.log('- Email:', email);
    console.log('- Channel ID:', channelId);
    
    // Create a regular client for auth context - Fix for cookies() usage
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const requestUserId = sessionData?.session?.user?.id || userId;
    
    if (!requestUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log('- User ID:', requestUserId);
    
    // Use the admin client for database operations to bypass RLS
    // If admin client isn't available, fall back to the regular client
    const dbClient = adminSupabase || supabase;
    
    // Verify the user is an admin of the channel
    const { data: userRole, error: roleError } = await dbClient
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', requestUserId)
      .single();
      
    if (roleError) {
      console.error('Role check error:', roleError);
      return NextResponse.json(
        { error: 'Cannot verify channel access', details: roleError.message },
        { status: 403 }
      );
    }
    
    if (userRole?.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin to invite users' },
        { status: 403 }
      );
    }
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Get channel details
    const { data: channel, error: channelError } = await dbClient
      .from('channels')
      .select('id, name, description')
      .eq('id', channelId)
      .single();
      
    if (channelError) {
      console.error('Channel fetch error:', channelError);
      return NextResponse.json(
        { error: 'Channel not found', details: channelError.message },
        { status: 404 }
      );
    }
    
    // First check if user exists in auth system
    let authUser = null;
    if (adminSupabase) {
      try {
        // Using the admin API to find user by email
        const { data: users, error } = await adminSupabase.auth.admin.listUsers();
        if (!error && users) {
          const userWithEmail = users.users.find(user => 
            user.email?.toLowerCase() === normalizedEmail
          );
          if (userWithEmail) {
            authUser = { user: userWithEmail };
            console.log(`Found user in auth system with ID: ${userWithEmail.id}`);
          } else {
            console.log(`No user found in auth system with email: ${normalizedEmail}`);
          }
        }
      } catch (error) {
        console.error('Error checking auth user:', error);
        // Continue with the flow
      }
    } else {
      console.log('Admin Supabase client not available, skipping auth user check');
    }
    
    // Check if the user has a profile
    const { data: existingUser, error: userError } = await dbClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();
      
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (existingUser) {
      console.log(`Found user profile with ID: ${existingUser.id}`);
    } else {
      console.log(`No user profile found for email: ${normalizedEmail}`);
    }
    
    // If user exists either in auth or has a profile, add them to the channel
    if (existingUser || authUser?.user) {
      const userId = existingUser?.id || authUser?.user.id;
      console.log(`User exists with id ${userId}, adding them to channel ${channelId}`);
      
      // If the user exists in auth but doesn't have a profile, create one
      if (authUser?.user && !existingUser) {
        console.log(`Creating profile for user ${userId} with email ${normalizedEmail}`);
        const { error: profileError } = await dbClient
          .from('profiles')
          .insert({
            id: userId,
            email: normalizedEmail,
            full_name: authUser.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
            avatar_url: authUser.user.user_metadata?.avatar_url || null
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Continue with the flow as we can still add them to the channel
        }
      }
      
      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await dbClient
        .from("channel_members")
        .select("id")
        .eq("channel_id", channelId)
        .eq("user_id", userId)
        .maybeSingle();
        
      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError;
      }
      
      if (existingMember) {
        return NextResponse.json(
          { message: `${normalizedEmail} is already a member of this channel` },
          { status: 200 }
        );
      }
      
      // Add user to channel
      const { error: addError } = await dbClient
        .from("channel_members")
        .insert({
          channel_id: channelId,
          user_id: userId,
          role: "member"
        });
        
      if (addError) {
        throw addError;
      }
      
      // Send notification in the channel
      await dbClient
        .from("messages")
        .insert({
          channel_id: channelId,
          user_id: requestUserId,
          content: `${existingUser?.full_name || normalizedEmail} has been added to the channel`,
          is_notification: true
        });
        
      return NextResponse.json(
        { 
          message: `${existingUser?.full_name || normalizedEmail} has been added to the channel`,
          userAdded: true,
          addedUserId: userId
        },
        { status: 200 }
      );
    } else {
      // User doesn't exist, create an invitation
      console.log(`User doesn't exist, creating invitation for ${normalizedEmail}`);
      
      // Generate a secure random token
      const invitationToken = crypto.randomBytes(32).toString('hex');
      
      // Check if there's an existing invitation for this email and channel
      const { data: existingInvitation, error: invitationCheckError } = await dbClient
        .from('invitations')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('channel_id', channelId)
        .is('redeemed_at', null)
        .maybeSingle();
        
      if (invitationCheckError && invitationCheckError.code !== 'PGRST116') {
        throw invitationCheckError;
      }
      
      // If there's an existing invitation, update it with a new token and expiration date
      if (existingInvitation) {
        const { error: updateError } = await dbClient
          .from('invitations')
          .update({
            invitation_token: invitationToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          })
          .eq('id', existingInvitation.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Create a new invitation
        const { error: createError } = await dbClient
          .from('invitations')
          .insert({
            email: normalizedEmail,
            channel_id: channelId,
            invited_by: requestUserId,
            invitation_token: invitationToken
          });
          
        if (createError) {
          console.error('Error creating invitation:', createError);
          throw createError;
        }
      }
      
      // Construct the invitation URL
      const invitationUrl = `${APP_URL}/invite?token=${invitationToken}`;
      
      // Log the invitation URL for development (no email sending)
      console.log(`[DEVELOPMENT] Invitation URL: ${invitationUrl}`);
      
      return NextResponse.json(
        { 
          message: `Invitation has been sent to ${normalizedEmail}`,
          invitationUrl: process.env.NODE_ENV === 'development' ? invitationUrl : undefined
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process invitation' },
      { status: 500 }
    );
  }
}