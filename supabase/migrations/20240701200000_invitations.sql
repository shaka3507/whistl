-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    email TEXT NOT NULL,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
    invitation_token TEXT NOT NULL UNIQUE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.invitations(email);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON public.invitations(invitation_token);

-- Setup RLS (Row Level Security)
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Channel admins can view invitations for their channels"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_members.channel_id = invitations.channel_id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

CREATE POLICY "Channel admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_members.channel_id = invitations.channel_id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

CREATE POLICY "Public can read invitations by token"
  ON public.invitations FOR SELECT
  USING (
    TRUE
  );

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.invitations TO authenticated;
GRANT SELECT ON public.invitations TO anon; 