-- Create message_acknowledgments table
CREATE TABLE IF NOT EXISTS public.message_acknowledgments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(message_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS message_acknowledgments_message_id_idx ON public.message_acknowledgments(message_id);
CREATE INDEX IF NOT EXISTS message_acknowledgments_user_id_idx ON public.message_acknowledgments(user_id);

-- Setup RLS (Row Level Security)
ALTER TABLE public.message_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Users can view their own acknowledgments
CREATE POLICY "Users can view their own message acknowledgments" 
    ON public.message_acknowledgments 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Channel admins can view all acknowledgments for their channels
CREATE POLICY "Channel admins can view all acknowledgments for their channels" 
    ON public.message_acknowledgments 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.channel_members cm
            JOIN public.messages m ON m.channel_id = cm.channel_id
            WHERE m.id = message_acknowledgments.message_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );

-- Users can create their own acknowledgments
CREATE POLICY "Users can create their own message acknowledgments" 
    ON public.message_acknowledgments 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.message_acknowledgments TO authenticated;

-- Add requires_acknowledgment column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS requires_acknowledgment BOOLEAN DEFAULT FALSE; 