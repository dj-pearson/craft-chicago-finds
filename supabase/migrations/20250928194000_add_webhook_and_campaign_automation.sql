-- Add webhook configuration table
CREATE TABLE public.webhook_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  secret_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  platforms TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['facebook', 'twitter', 'linkedin']
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add post variants to social_media_posts table (title already exists)
ALTER TABLE public.social_media_posts 
ADD COLUMN short_description TEXT, -- For Twitter/X, Threads (280 chars)
ADD COLUMN long_description TEXT,  -- For Facebook, LinkedIn (longer form)
ADD COLUMN webhook_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN webhook_response JSONB,
ADD COLUMN auto_generated BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN campaign_day INTEGER, -- Day number in campaign (1-30)
ADD COLUMN post_theme TEXT; -- e.g., 'teaser', 'vendor_spotlight', 'countdown'

-- Create campaign automation table
CREATE TABLE public.campaign_automation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.social_media_campaigns(id) ON DELETE CASCADE,
  total_days INTEGER NOT NULL DEFAULT 30,
  posts_generated INTEGER NOT NULL DEFAULT 0,
  automation_status TEXT NOT NULL DEFAULT 'pending' CHECK (automation_status IN ('pending', 'generating', 'completed', 'failed')),
  generation_progress JSONB DEFAULT '{}'::jsonb,
  webhook_settings_id UUID REFERENCES public.webhook_settings(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook logs table
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  request_payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_settings
CREATE POLICY "Admins can manage webhook settings" 
ON public.webhook_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Create policies for campaign_automation
CREATE POLICY "Admins and city moderators can manage campaign automation" 
ON public.campaign_automation 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'city_moderator') 
    AND is_active = true
  )
);

-- Create policies for webhook_logs
CREATE POLICY "Admins can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_webhook_settings_updated_at
BEFORE UPDATE ON public.webhook_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_automation_updated_at
BEFORE UPDATE ON public.campaign_automation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_webhook_settings_active ON public.webhook_settings(is_active) WHERE is_active = true;
CREATE INDEX idx_campaign_automation_status ON public.campaign_automation(automation_status);
CREATE INDEX idx_webhook_logs_post_id ON public.webhook_logs(post_id);
CREATE INDEX idx_webhook_logs_sent_at ON public.webhook_logs(sent_at DESC);
CREATE INDEX idx_social_posts_campaign_day ON public.social_media_posts(campaign_day) WHERE campaign_day IS NOT NULL;
-- Note: idx_social_posts_scheduled already exists, skipping duplicate

-- Add foreign key constraints
ALTER TABLE public.webhook_settings 
ADD CONSTRAINT webhook_settings_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.campaign_automation 
ADD CONSTRAINT campaign_automation_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Insert default 30-day campaign themes based on Social.md
INSERT INTO public.social_media_templates (
  name,
  description,
  template_type,
  platform,
  content_template,
  hashtag_template,
  variables,
  is_active,
  created_by
) VALUES 
-- Week 1: Teasers and Brand Introduction (Days 1-7)
(
  'Day 1: Mystery Teaser',
  'Opening teaser to create curiosity',
  'countdown',
  'all',
  'Calling all {city_name} creators and lovers of handmade goods – something exciting is brewing for you this fall! 🎨🧵 Stay tuned for a big announcement... {teaser_hint}',
  ARRAY['#comingsoon', '#{city_slug}', '#handmade'],
  '{"city_name": "string", "city_slug": "string", "teaser_hint": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Day 2: Problem & Solution Hint',
  'Identify the need and hint at solution',
  'community',
  'all',
  'Tired of juggling local craft fairs and online marketplaces that don''t really feel ''local''? We hear you. {city_name} has thousands of talented artisans – imagine if we could shop all their creations in one place! {solution_hint}',
  ARRAY['#{city_slug}Makers', '#LocalArtisans', '#CraftFairs'],
  '{"city_name": "string", "city_slug": "string", "solution_hint": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Day 3: Brand Reveal',
  'Official CraftLocal announcement',
  'announcement',
  'all',
  '🎊 Introducing CraftLocal – {city_name}''s very own craft marketplace! 🎊 We are launching on {launch_date} to connect {city_name}''s amazing makers with people who love handmade, local goods. Whether you''re a crafter or a shopper, get ready for a new way to shop local online!',
  ARRAY['#CraftLocal', '#{city_slug}Makers', '#ShopLocal'],
  '{"city_name": "string", "city_slug": "string", "launch_date": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
-- Week 2: Education and Engagement (Days 8-14)
(
  'Holiday Motivation Post',
  'Motivate vendors for holiday season',
  'seasonal',
  'all',
  'The holiday shopping season is around the corner – is your small business ready? 🎁 {city_name} makers, we want to help you shine during the holidays. CraftLocal launches {launch_date}, giving you nearly 8 weeks of prime holiday selling time online! 🙌',
  ARRAY['#{city_slug}Makers', '#HolidayShopping', '#SmallBusiness'],
  '{"city_name": "string", "city_slug": "string", "launch_date": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
-- Week 3: Countdown and Promotions (Days 15-21)
(
  'Two Week Countdown',
  'Formal countdown begins',
  'countdown',
  'all',
  'The countdown starts NOW – only {days_left} days until CraftLocal is live! 🗓️🎉 We can''t wait to open the (virtual) doors for {city_name}''s makers. Mark your calendars: {launch_date} is launch day. Each day until then, we''ll be sharing sneak peeks, tips, and maybe even some freebies 😉',
  ARRAY['#CraftLocalCountdown', '#{city_slug}Makers'],
  '{"days_left": "number", "city_name": "string", "city_slug": "string", "launch_date": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
-- Week 4: Final Push and Launch (Days 22-30)
(
  'Final Week Countdown',
  'Daily countdown for final week',
  'countdown',
  'all',
  '⏱️ {days_left} days until launch! {city_name} makers – here''s exactly how you can hit the ground running on {launch_date}. We''ve made the onboarding super simple. Tip: Use these last {days_left} days to take product photos and write descriptions, so you can list them ASAP!',
  ARRAY['#{days_left}DaysToGo', '#CraftLocal', '#{city_slug}Makers'],
  '{"days_left": "number", "city_name": "string", "city_slug": "string", "launch_date": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Launch Day Announcement',
  'The big launch day post',
  'announcement',
  'all',
  '🌟 We Are LIVE – CraftLocal is Now Open! 🌟 The wait is over – CraftLocal is officially launched! 🥳 {city_name}''s first local-only craft marketplace is up and running at craftlocal.net. Vendors: you can now sign up and start listing your products. Shoppers: come take a look at the amazing local goods now available at your fingertips!',
  ARRAY['#LaunchDay', '#CraftLocalLaunch', '#{city_slug}Makers', '#WeDidIt'],
  '{"city_name": "string", "city_slug": "string"}'::jsonb,
  true,
  (SELECT id FROM auth.users LIMIT 1)
);
