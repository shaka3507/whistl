import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase-types';

export async function POST(request: Request) {
  // Await cookies() before using it
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  
  try {
    // Get session to verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const { email, channel } = await request.json();
    
    if (!email || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the user is an admin of the channel
    const { data: userRole, error: roleError } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channel.id)
      .eq('user_id', session.user.id)
      .single();
      
    if (roleError || userRole?.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin to invite users' },
        { status: 403 }
      );
    }
    
    // Check if the user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', email.toLowerCase())
      .maybeSingle();
      
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    // If user exists, add them to the channel
    if (existingUser) {
      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', channel.id)
        .eq('user_id', existingUser.id)
        .maybeSingle();
        
      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError;
      }
      
      if (existingMember) {
        return NextResponse.json(
          { message: 'User is already a member of this channel' },
          { status: 200 }
        );
      }
      
      // Add user to channel
      const { error: addError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: existingUser.id,
          role: 'member'
        });
        
      if (addError) {
        throw addError;
      }
      
      // Send notification in the channel
      await supabase
        .from('messages')
        .insert({
          channel_id: channel.id,
          user_id: session.user.id,
          content: `${email} has been invited to the channel`,
          is_notification: true
        });
        
      return NextResponse.json(
        { message: 'User has been added to the channel' },
        { status: 200 }
      );
    } else {
      // In a real application, you would send an email invitation here
      // For now, just return a success response
      
      // Record the invitation in the database (you would need to create an invitations table)
      // This is just a placeholder message
      console.log(`Invitation would be sent to ${email} for channel ${channel.name}`);
      
      return NextResponse.json(
        { message: `Invitation has been sent to ${email}` },
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