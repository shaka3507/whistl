-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Create channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create channel_members table
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_notification BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  has_attachment BOOLEAN DEFAULT FALSE
);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Channel members can view profiles of other members in the same channel"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm1
      JOIN channel_members cm2 ON cm1.channel_id = cm2.channel_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id
    )
  );

-- Create policies for channels
CREATE POLICY "Channel members can view channels they belong to"
  ON channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create channels"
  ON channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Channel admins can update channels"
  ON channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

CREATE POLICY "Channel admins can delete channels"
  ON channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

-- Create policies for channel_members
CREATE POLICY "Channel members can view other members in their channels"
  ON channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members AS cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()
    )
  );

-- Create policies for channel_members with correct usage
CREATE POLICY "Channel admins can add members"
  ON channel_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members AS cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
    OR
    (channel_members.user_id = auth.uid() AND channel_members.role = 'admin' AND 
     EXISTS (
       SELECT 1 FROM channels
       WHERE channels.id = channel_members.channel_id
       AND channels.created_by = auth.uid()
     ))
  );

-- Create policies for messages with correct usage
CREATE POLICY "Channel members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members AS cm
      WHERE cm.channel_id = messages.channel_id
      AND cm.user_id = auth.uid()
    )
    AND (
      (messages.is_notification = FALSE AND messages.has_attachment = FALSE)
      OR
      ((messages.is_notification = TRUE OR messages.has_attachment = TRUE)
        AND EXISTS (
          SELECT 1 FROM channel_members AS cm
          WHERE cm.channel_id = messages.channel_id
          AND cm.user_id = auth.uid()
          AND cm.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Channel admins can update member roles"
  ON channel_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channel_members.channel_id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

CREATE POLICY "Channel admins can remove members"
  ON channel_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channel_members.channel_id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

-- Create policies for alerts
CREATE POLICY "Channel members can view alerts for their channels"
  ON alerts FOR SELECT
  USING (
    alerts.channel_id IS NULL OR
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = alerts.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create alerts"
  ON alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update alerts"
  ON alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete alerts"
  ON alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Create policies for messages
CREATE POLICY "Channel members can view messages in their channels"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', TRUE);

-- Set up storage policies
CREATE POLICY "Channel members can view attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = (storage.foldername(name))[1]::uuid
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel admins can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments' AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = (storage.foldername(name))[1]::uuid
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-attachments' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );