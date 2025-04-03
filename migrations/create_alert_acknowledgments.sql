-- Create alert_acknowledgments table
CREATE TABLE IF NOT EXISTS alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alert_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE alert_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own acknowledgments and channel admins to see all acknowledgments
CREATE POLICY "Users can view their own acknowledgments" 
  ON alert_acknowledgments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Channel admins can view all acknowledgments for their channels" 
  ON alert_acknowledgments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      JOIN alerts a ON a.channel_id = cm.channel_id
      WHERE a.id = alert_acknowledgments.alert_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- Allow users to create their own acknowledgments
CREATE POLICY "Users can create their own acknowledgments" 
  ON alert_acknowledgments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own acknowledgments
CREATE POLICY "Users can update their own acknowledgments" 
  ON alert_acknowledgments FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add requires_acknowledgment column to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS requires_acknowledgment BOOLEAN NOT NULL DEFAULT FALSE; 