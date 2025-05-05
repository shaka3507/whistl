import axios from 'axios';
import { Database } from './supabase-types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface EmailNotificationParams {
  to: string;
  subject: string;
  text: string;
  channelId: string;
  channelName?: string;
}

// Send email notifications to users who have enabled them
export async function sendEmailNotificationToUser(
  profile: Profile,
  subject: string,
  text: string,
  channelId: string,
  channelName?: string
) {
  // Skip if user has not enabled email notifications or has no email
  if (!profile.email_notifications) {
    return { skipped: true, reason: 'notifications disabled' };
  }

  try {
    const response = await axios.post('/api/send-email-notification', {
      to: profile.id,
      subject,
      text,
      channelId,
      channelName
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return { success: false, error };
  }
}

// Send email notifications to all members of a channel who have enabled them
export async function sendEmailNotificationsToChannel(
  channelId: string,
  subject: string,
  text: string,
  excludeUserId?: string // Optional user ID to exclude (e.g., the sender)
) {
  try {
    const response = await axios.post('/api/send-channel-email-notifications', {
      channelId,
      subject,
      text,
      excludeUserId
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to send channel email notifications:', error);
    return { success: false, error };
  }
} 