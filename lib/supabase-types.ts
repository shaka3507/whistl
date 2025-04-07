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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          updated_at: string
          phone_number: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
          phone_number?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
          phone_number?: string | null
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



