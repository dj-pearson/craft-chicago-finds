-- Create ai_settings table for centralized AI model configuration
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  model_provider TEXT NOT NULL DEFAULT 'anthropic',
  api_endpoint TEXT NOT NULL DEFAULT 'https://api.anthropic.com/v1/messages',
  max_tokens INTEGER NOT NULL DEFAULT 4000,
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  system_prompt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_media_campaigns table
CREATE TABLE public.social_media_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('launch', 'seasonal', 'promotional', 'engagement', 'countdown')),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  target_audience TEXT,
  goals TEXT,
  hashtags TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_media_posts table
CREATE TABLE public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.social_media_campaigns(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok')),
  post_type TEXT NOT NULL CHECK (post_type IN ('text', 'image', 'video', 'carousel', 'story', 'reel')),
  title TEXT,
  content TEXT NOT NULL,
  hashtags TEXT[],
  media_urls TEXT[],
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed', 'cancelled')),
  engagement_stats JSONB DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_prompt TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_media_templates table
CREATE TABLE public.social_media_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('countdown', 'vendor_spotlight', 'product_feature', 'community', 'seasonal', 'announcement')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'all')),
  content_template TEXT NOT NULL,
  hashtag_template TEXT[],
  variables JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_generation_logs table
CREATE TABLE public.ai_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_used TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('social_post', 'campaign_content', 'template', 'test', 'other')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_settings (admin only)
CREATE POLICY "Admins can manage AI settings" 
ON public.ai_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Create policies for social_media_campaigns
CREATE POLICY "Admins and city moderators can manage campaigns" 
ON public.social_media_campaigns 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'city_moderator') 
    AND is_active = true
  )
);

-- Create policies for social_media_posts
CREATE POLICY "Admins and city moderators can manage posts" 
ON public.social_media_posts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'city_moderator') 
    AND is_active = true
  )
);

-- Create policies for social_media_templates
CREATE POLICY "Admins and city moderators can manage templates" 
ON public.social_media_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'city_moderator') 
    AND is_active = true
  )
);

-- Create policies for ai_generation_logs
CREATE POLICY "Users can view their own AI generation logs" 
ON public.ai_generation_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI generation logs" 
ON public.ai_generation_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI generation logs" 
ON public.ai_generation_logs 
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
CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_campaigns_updated_at
BEFORE UPDATE ON public.social_media_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_posts_updated_at
BEFORE UPDATE ON public.social_media_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_templates_updated_at
BEFORE UPDATE ON public.social_media_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_social_campaigns_city ON public.social_media_campaigns(city_id);
CREATE INDEX idx_social_campaigns_status ON public.social_media_campaigns(status);
CREATE INDEX idx_social_campaigns_dates ON public.social_media_campaigns(start_date, end_date);

CREATE INDEX idx_social_posts_campaign ON public.social_media_posts(campaign_id);
CREATE INDEX idx_social_posts_city ON public.social_media_posts(city_id);
CREATE INDEX idx_social_posts_platform ON public.social_media_posts(platform);
CREATE INDEX idx_social_posts_status ON public.social_media_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.social_media_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX idx_social_templates_type ON public.social_media_templates(template_type);
CREATE INDEX idx_social_templates_platform ON public.social_media_templates(platform);
CREATE INDEX idx_social_templates_active ON public.social_media_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_ai_logs_user ON public.ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_type ON public.ai_generation_logs(generation_type);
CREATE INDEX idx_ai_logs_created_at ON public.ai_generation_logs(created_at DESC);

-- Add foreign key constraints
ALTER TABLE public.social_media_campaigns 
ADD CONSTRAINT social_media_campaigns_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.social_media_posts 
ADD CONSTRAINT social_media_posts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.social_media_templates 
ADD CONSTRAINT social_media_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.ai_generation_logs 
ADD CONSTRAINT ai_generation_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Insert default AI settings
INSERT INTO public.ai_settings (
  model_name,
  model_provider,
  api_endpoint,
  max_tokens,
  temperature,
  system_prompt,
  is_active
) VALUES (
  'claude-sonnet-4-20250514',
  'anthropic',
  'https://api.anthropic.com/v1/messages',
  4000,
  0.7,
  'You are a social media expert helping create engaging content for local craft marketplaces. Focus on community building, supporting local artisans, and encouraging authentic engagement. Keep content friendly, creative, and supportive.',
  true
);

-- Insert default social media templates
INSERT INTO public.social_media_templates (
  name,
  description,
  template_type,
  platform,
  content_template,
  hashtag_template,
  variables,
  is_active
) VALUES 
(
  'Countdown Launch Template',
  'Template for countdown posts leading to marketplace launch',
  'countdown',
  'all',
  '🎉 Only {days_left} days until {city_name} Makers Marketplace launches! {description} Are you ready to discover amazing local crafts? {call_to_action}',
  ARRAY['#{city_slug}Makers', '#CraftLocal', '#ShopLocal', '#SupportSmallBusiness', '#HandmadeGifts'],
  '{"days_left": "number", "city_name": "string", "description": "string", "call_to_action": "string"}'::jsonb,
  true
),
(
  'Vendor Spotlight Template',
  'Template for featuring local vendors and makers',
  'vendor_spotlight',
  'all',
  '✨ Vendor Spotlight: Meet {vendor_name}! {vendor_description} You can find their amazing {product_types} on {marketplace_name} starting {launch_date}. {vendor_story}',
  ARRAY['#{city_slug}Makers', '#VendorSpotlight', '#LocalArtisan', '#HandmadeCrafts', '#SupportLocal'],
  '{"vendor_name": "string", "vendor_description": "string", "product_types": "string", "marketplace_name": "string", "launch_date": "string", "vendor_story": "string"}'::jsonb,
  true
),
(
  'Community Engagement Template',
  'Template for community building and engagement posts',
  'community',
  'all',
  '💬 {city_name} crafters and makers! {question} Share your thoughts in the comments and tag a friend who loves {craft_type}! {community_message}',
  ARRAY['#{city_slug}Community', '#CraftLocal', '#LocalMakers', '#CommunityLove'],
  '{"city_name": "string", "question": "string", "craft_type": "string", "community_message": "string"}'::jsonb,
  true
);
