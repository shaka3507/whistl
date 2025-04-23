-- Create the push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- Setup RLS (Row Level Security)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own push subscriptions" 
    ON public.push_subscriptions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create/update their own subscriptions
CREATE POLICY "Users can insert their own push subscriptions" 
    ON public.push_subscriptions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" 
    ON public.push_subscriptions 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete their own push subscriptions" 
    ON public.push_subscriptions 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- Add notification_type column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS notification_type TEXT;

-- Add custom function to send push notifications
CREATE OR REPLACE FUNCTION send_push_notification(
    target_user_id UUID,
    notification_title TEXT,
    notification_body TEXT,
    notification_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
    response JSONB;
BEGIN
    SELECT
        content INTO response
    FROM
        http(
            (
                'POST',
                current_setting('app.supabase_url') || '/functions/v1/push-notifications',
                ARRAY[
                    http_header('Authorization', 'Bearer ' || current_setting('app.anon_key')),
                    http_header('Content-Type', 'application/json')
                ],
                jsonb_build_object(
                    'userId', target_user_id,
                    'title', notification_title,
                    'body', notification_body,
                    'url', notification_url
                )::TEXT,
                5000
            )
        );
    
    IF response->>'success' = 'true' THEN
        success := TRUE;
    END IF;
    
    RETURN success;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 