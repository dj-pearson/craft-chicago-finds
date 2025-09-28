-- Create moderation_logs table for tracking admin actions
CREATE TABLE public.moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'remove', 'restore')),
  reason TEXT,
  notes TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation_logs
CREATE POLICY "Admins can view all moderation logs" 
ON public.moderation_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

CREATE POLICY "Admins and moderators can create moderation logs" 
ON public.moderation_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() = moderator_id AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'city_moderator') 
    AND is_active = true
  )
);

-- Create indexes for better performance
CREATE INDEX idx_moderation_logs_listing ON public.moderation_logs(listing_id);
CREATE INDEX idx_moderation_logs_moderator ON public.moderation_logs(moderator_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);

-- Add moderation fields to listings table if they don't exist
DO $$ 
BEGIN
  -- Add moderated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'moderated_at') THEN
    ALTER TABLE public.listings ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add moderated_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'moderated_by') THEN
    ALTER TABLE public.listings ADD COLUMN moderated_by UUID;
  END IF;
  
  -- Add moderation_notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'moderation_notes') THEN
    ALTER TABLE public.listings ADD COLUMN moderation_notes TEXT;
  END IF;
END $$;

-- Add foreign key constraint for moderated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'listings_moderated_by_fkey'
  ) THEN
    ALTER TABLE public.listings 
    ADD CONSTRAINT listings_moderated_by_fkey 
    FOREIGN KEY (moderated_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Update listings status constraint to include new moderation statuses
ALTER TABLE public.listings 
DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE public.listings 
ADD CONSTRAINT listings_status_check 
CHECK (status IN ('draft', 'pending', 'active', 'inactive', 'rejected', 'flagged', 'removed', 'sold'));

-- Create index on moderation fields
CREATE INDEX IF NOT EXISTS idx_listings_moderated_at ON public.listings(moderated_at) WHERE moderated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_moderated_by ON public.listings(moderated_by) WHERE moderated_by IS NOT NULL;
