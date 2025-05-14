-- Migration to add a trigger that prevents poll creators from responding to their own polls

-- Create a function that checks if the user is the creator of the poll
CREATE OR REPLACE FUNCTION check_poll_creator_response()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Get the creator_id of the poll
  SELECT created_by INTO creator_id 
  FROM public.polls 
  WHERE id = NEW.poll_id;
  
  -- If the user trying to respond is the creator, reject the operation
  IF NEW.user_id = creator_id THEN
    RAISE EXCEPTION 'Poll creators cannot respond to their own polls';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that executes the function before insert or update
CREATE TRIGGER prevent_poll_creator_response
BEFORE INSERT OR UPDATE ON public.poll_responses
FOR EACH ROW
EXECUTE FUNCTION check_poll_creator_response();

-- Add comment explaining the constraint
COMMENT ON TRIGGER prevent_poll_creator_response ON public.poll_responses IS 
'Prevents poll creators from responding to their own polls'; 