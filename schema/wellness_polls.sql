-- Wellness Poll Feature Schema Extensions

-- Table for polls
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  poll_type TEXT NOT NULL DEFAULT 'wellness', -- For future extensions to support other poll types
  min_value INTEGER NOT NULL DEFAULT 1,
  max_value INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration time
  
  CONSTRAINT polls_valid_range CHECK (min_value < max_value)
);

-- Table for poll responses
CREATE TABLE IF NOT EXISTS public.poll_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  response_value INTEGER NOT NULL,
  comment TEXT, -- Optional comment with the response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Each user can only respond once to a poll
  CONSTRAINT poll_responses_unique_user UNIQUE(poll_id, user_id)
  
  -- Removing the invalid check constraint that uses a subquery
  -- Instead, we'll implement a trigger for this validation
);

-- Create a function to validate response values against poll range
CREATE OR REPLACE FUNCTION validate_poll_response_range()
RETURNS TRIGGER AS $$
DECLARE
  poll_min_value INTEGER;
  poll_max_value INTEGER;
BEGIN
  -- Get the min and max values directly from the polls table
  SELECT min_value, max_value INTO poll_min_value, poll_max_value 
  FROM public.polls 
  WHERE id = NEW.poll_id;
  
  -- Check if the response_value is within the poll's min_value and max_value
  IF NEW.response_value < poll_min_value OR NEW.response_value > poll_max_value THEN
    RAISE EXCEPTION 'Response value must be between % and %', poll_min_value, poll_max_value;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that executes the validation function before insert or update
CREATE TRIGGER check_poll_response_range
BEFORE INSERT OR UPDATE ON public.poll_responses
FOR EACH ROW
EXECUTE FUNCTION validate_poll_response_range();

-- Add RLS policies
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

-- Admin can create and read all polls in channels they're an admin of
CREATE POLICY "Admins can create polls" ON public.polls
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_members.channel_id = polls.channel_id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

CREATE POLICY "Channel members can read polls" ON public.polls
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_members.channel_id = polls.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Channel members can respond to polls
CREATE POLICY "Members can respond to polls" ON public.poll_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls
      JOIN public.channel_members ON channel_members.channel_id = polls.channel_id
      WHERE polls.id = poll_responses.poll_id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Users can read all poll responses for polls in their channels
CREATE POLICY "Members can read poll responses" ON public.poll_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.polls
      JOIN public.channel_members ON channel_members.channel_id = polls.channel_id
      WHERE polls.id = poll_responses.poll_id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Create a policy for updating poll responses
CREATE POLICY "Members can update their poll responses" ON public.poll_responses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add custom type definition to the Database interface
COMMENT ON TABLE public.polls IS '@typeChange: "poll_type" type WellnessPollType "wellness"';
COMMENT ON TYPE WellnessPollType IS 'wellness'; 