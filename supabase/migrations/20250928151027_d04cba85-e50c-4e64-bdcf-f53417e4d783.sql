-- Update the profiles table to include seller-specific fields and better user management
-- First, add missing fields to the existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seller_description TEXT,
ADD COLUMN IF NOT EXISTS seller_categories TEXT[],
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_orders": true, "email_messages": true, "email_marketing": false}',
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_seller_verified ON public.profiles(seller_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_is_seller ON public.profiles(is_seller);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);

-- Update the handle_new_user function to include more default fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    email, 
    is_seller,
    notification_preferences,
    last_seen_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'is_seller')::boolean, false),
    '{"email_orders": true, "email_messages": true, "email_marketing": false}',
    now()
  );
  RETURN NEW;
END;
$$;

-- Create function to update last seen timestamp
CREATE OR REPLACE FUNCTION public.update_last_seen(_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles 
  SET last_seen_at = now() 
  WHERE user_id = _user_id;
$$;

-- Create RLS policy for profiles last_seen updates
CREATE POLICY "Users can update their own last_seen timestamp" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND last_seen_at IS NOT NULL);