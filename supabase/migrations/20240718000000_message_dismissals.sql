-- Create message_dismissals table
CREATE TABLE IF NOT EXISTS public.message_dismissals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(message_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS message_dismissals_message_id_idx ON public.message_dismissals(message_id);
CREATE INDEX IF NOT EXISTS message_dismissals_user_id_idx ON public.message_dismissals(user_id);

-- Setup RLS (Row Level Security)
ALTER TABLE public.message_dismissals ENABLE ROW LEVEL SECURITY;

-- Users can view their own dismissals
CREATE POLICY "Users can view their own message dismissals" 
    ON public.message_dismissals 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Channel admins can view all dismissals for their channels
CREATE POLICY "Channel admins can view all dismissals for their channels" 
    ON public.message_dismissals 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.channel_members cm
            JOIN public.messages m ON m.channel_id = cm.channel_id
            WHERE m.id = message_dismissals.message_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );

-- Users can create their own dismissals
CREATE POLICY "Users can create their own message dismissals" 
    ON public.message_dismissals 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.message_dismissals TO authenticated;

-- Add function to easily check if a message has been dismissed
CREATE OR REPLACE FUNCTION is_message_dismissed(message_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.message_dismissals
    WHERE message_dismissals.message_id = $1
    AND message_dismissals.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 