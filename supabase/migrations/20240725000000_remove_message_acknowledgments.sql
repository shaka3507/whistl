-- Drop the unused message_acknowledgments table and related objects
DROP FUNCTION IF EXISTS public.is_message_acknowledged;
DROP POLICY IF EXISTS "Users can view their own message acknowledgments" ON public.message_acknowledgments;
DROP POLICY IF EXISTS "Channel admins can view all acknowledgments for their channels" ON public.message_acknowledgments;
DROP POLICY IF EXISTS "Users can create their own message acknowledgments" ON public.message_acknowledgments;
DROP TABLE IF EXISTS public.message_acknowledgments; 