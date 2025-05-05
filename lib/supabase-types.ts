export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          severity: "low" | "medium" | "high" | "critical"
          created_by: string
          is_active: boolean
          channel_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          severity: "low" | "medium" | "high" | "critical"
          created_by: string
          is_active?: boolean
          channel_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          severity?: "low" | "medium" | "high" | "critical"
          created_by?: string
          is_active?: boolean
          channel_id?: string | null
        }
      }
      channels: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          created_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          created_by: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          created_by?: string
        }
      }
      channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          role: "admin" | "member"
          joined_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          role?: "admin" | "member"
          joined_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          role?: "admin" | "member"
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          content: string
          created_at: string
          is_notification: boolean
          parent_id: string | null
          has_attachment: boolean
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          content: string
          created_at?: string
          is_notification?: boolean
          parent_id?: string | null
          has_attachment?: boolean
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          content?: string
          created_at?: string
          is_notification?: boolean
          parent_id?: string | null
          has_attachment?: boolean
        }
      }
      polls: {
        Row: {
          id: string
          channel_id: string
          created_by: string
          title: string
          description: string | null
          poll_type: "wellness"
          min_value: number
          max_value: number
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          channel_id: string
          created_by: string
          title: string
          description?: string | null
          poll_type?: "wellness"
          min_value?: number
          max_value?: number
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          channel_id?: string
          created_by?: string
          title?: string
          description?: string | null
          poll_type?: "wellness"
          min_value?: number
          max_value?: number
          created_at?: string
          expires_at?: string | null
        }
      }
      poll_responses: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          response_value: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          response_value: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          response_value?: number
          comment?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          updated_at: string
          phone_number: string | null
          email_notifications: boolean
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
          phone_number?: string | null
          email_notifications?: boolean
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
          phone_number?: string | null
          email_notifications?: boolean
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          channel_id: string
          invited_by: string
          created_at: string
          expires_at: string
          invitation_token: string
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          id?: string
          email: string
          channel_id: string
          invited_by: string
          created_at?: string
          expires_at?: string
          invitation_token: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          channel_id?: string
          invited_by?: string
          created_at?: string
          expires_at?: string
          invitation_token?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}



