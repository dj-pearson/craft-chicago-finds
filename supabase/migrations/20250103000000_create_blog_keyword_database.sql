-- Create blog keyword database tables for CraftLocal Chicago marketplace
-- This migration creates the infrastructure for storing and managing blog keywords

-- Create keyword clusters table
CREATE TABLE public.blog_keyword_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  search_intent TEXT NOT NULL CHECK (search_intent IN ('informational', 'commercial', 'local_commercial', 'local_informational', 'educational')),
  content_type TEXT NOT NULL,
  target_audience TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create keywords table
CREATE TABLE public.blog_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id INTEGER NOT NULL REFERENCES public.blog_keyword_clusters(cluster_id) ON DELETE CASCADE,
  primary_keyword TEXT NOT NULL,
  search_volume TEXT NOT NULL CHECK (search_volume IN ('low', 'medium', 'high')),
  competition TEXT NOT NULL CHECK (competition IN ('low', 'medium', 'high')),
  buyer_intent TEXT NOT NULL CHECK (buyer_intent IN ('low', 'medium', 'high')),
  local_modifier BOOLEAN NOT NULL DEFAULT false,
  seasonal BOOLEAN NOT NULL DEFAULT false,
  seasonal_months TEXT[] DEFAULT '{}',
  content_type TEXT NOT NULL,
  related_keywords TEXT[] NOT NULL DEFAULT '{}',
  blog_angle TEXT NOT NULL,
  product_category TEXT,
  priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog post templates table
CREATE TABLE public.blog_post_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  target_length TEXT NOT NULL,
  structure TEXT[] NOT NULL DEFAULT '{}',
  seo_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  applicable_clusters INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content calendar table for seasonal planning
CREATE TABLE public.blog_content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_name TEXT NOT NULL CHECK (month_name IN ('january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december')),
  focus_theme TEXT NOT NULL,
  priority_keywords TEXT[] NOT NULL DEFAULT '{}',
  seasonal_events TEXT[] DEFAULT '{}',
  target_posts_count INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month_name)
);

-- Create indexes for performance
CREATE INDEX idx_blog_keywords_cluster_id ON public.blog_keywords(cluster_id);
CREATE INDEX idx_blog_keywords_search_volume ON public.blog_keywords(search_volume);
CREATE INDEX idx_blog_keywords_local_modifier ON public.blog_keywords(local_modifier);
CREATE INDEX idx_blog_keywords_seasonal ON public.blog_keywords(seasonal);
CREATE INDEX idx_blog_keywords_priority ON public.blog_keywords(priority_score DESC);
CREATE INDEX idx_blog_keywords_last_used ON public.blog_keywords(last_used_at);
CREATE INDEX idx_blog_keywords_product_category ON public.blog_keywords(product_category);

-- Add GIN indexes for array columns
CREATE INDEX idx_blog_keywords_seasonal_months ON public.blog_keywords USING GIN(seasonal_months);
CREATE INDEX idx_blog_keywords_related ON public.blog_keywords USING GIN(related_keywords);
CREATE INDEX idx_blog_content_calendar_keywords ON public.blog_content_calendar USING GIN(priority_keywords);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_blog_keyword_clusters_updated_at 
  BEFORE UPDATE ON public.blog_keyword_clusters 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_keywords_updated_at 
  BEFORE UPDATE ON public.blog_keywords 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_post_templates_updated_at 
  BEFORE UPDATE ON public.blog_post_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_content_calendar_updated_at 
  BEFORE UPDATE ON public.blog_content_calendar 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.blog_keyword_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_content_calendar ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for blog content generation)
CREATE POLICY "Anyone can view blog keyword clusters"
ON public.blog_keyword_clusters
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view blog keywords"
ON public.blog_keywords
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view blog post templates"
ON public.blog_post_templates
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view blog content calendar"
ON public.blog_content_calendar
FOR SELECT
USING (true);

-- Create policies for admin management
CREATE POLICY "Admins can manage blog keyword clusters"
ON public.blog_keyword_clusters
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage blog keywords"
ON public.blog_keywords
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage blog post templates"
ON public.blog_post_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage blog content calendar"
ON public.blog_content_calendar
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Insert initial keyword clusters
INSERT INTO public.blog_keyword_clusters (cluster_id, name, description, search_intent, content_type, target_audience) VALUES
(1, 'Why Shop Local / Thought Leadership', 'Build authority and connect with mission-driven content', 'informational', 'evergreen_educational', ARRAY['conscious_consumers', 'local_supporters', 'handmade_enthusiasts']),
(2, 'Gift Guides & Buyer Keywords', 'Attract people searching for unique/local gifts', 'commercial', 'seasonal_gift_guides', ARRAY['gift_shoppers', 'holiday_buyers', 'special_occasion_shoppers']),
(3, 'Craft Fairs & Events', 'Traffic magnet - people always search near me events', 'local_commercial', 'event_guides', ARRAY['craft_fair_goers', 'weekend_shoppers', 'event_seekers']),
(4, 'Seller / Maker Education', 'Attract and onboard local sellers', 'educational', 'business_education', ARRAY['aspiring_sellers', 'craft_business_owners', 'local_makers']),
(5, 'Product-Specific Buyer Searches', 'Build blog posts that double as product category landing pages', 'commercial', 'category_guides', ARRAY['category_shoppers', 'specific_product_seekers', 'local_buyers']),
(6, 'Local SEO / City Guides', 'Perfect for scalable blog content targeting service areas', 'local_informational', 'city_guides', ARRAY['local_residents', 'chicago_visitors', 'neighborhood_explorers']),
(7, 'Educational / Informational Content', 'Evergreen content that brings traffic and builds trust', 'informational', 'evergreen_educational', ARRAY['curious_consumers', 'craft_enthusiasts', 'quality_seekers']);

-- Insert blog post templates
INSERT INTO public.blog_post_templates (template_name, target_length, structure, seo_requirements, applicable_clusters) VALUES
('Holiday & Occasion Gift Guide', '2000-3000 words', 
 ARRAY['Introduction with local angle', 'Why handmade gifts matter', 'Featured product categories', 'Price range breakdowns', 'Local maker spotlights', 'Shopping tips', 'Call-to-action to browse marketplace'],
 '{"title_format": "[Keyword] - [Year] Chicago Local Guide", "meta_description_length": "150-160 characters", "header_structure": "H1, H2, H3 with keyword variations", "internal_links": "Link to product categories and maker profiles", "external_links": "Link to relevant local resources"}'::jsonb,
 ARRAY[2]),

('Product Category Deep Dive', '1500-2500 words',
 ARRAY['Category overview with local context', 'Featured local makers', 'Product showcase', 'Price and quality insights', 'Buying guide section', 'Care and maintenance tips', 'Related categories'],
 '{"title_format": "[Product Category] Handmade in Chicago - Local Maker Guide", "meta_description_length": "150-160 characters", "header_structure": "H1, H2, H3 with product keywords", "internal_links": "Link to maker profiles and product listings", "external_links": "Link to craft education resources"}'::jsonb,
 ARRAY[5]),

('Seller Education & Business Guide', '2500-4000 words',
 ARRAY['Problem identification', 'Step-by-step solution guide', 'Local Chicago specific tips', 'Case studies or examples', 'Resource links and tools', 'Common mistakes to avoid', 'Next steps and action items'],
 '{"title_format": "[How-to Keyword] - Complete Chicago Maker Guide [Year]", "meta_description_length": "150-160 characters", "header_structure": "H1, H2, H3 with question-based headers", "internal_links": "Link to seller onboarding and resources", "external_links": "Link to business resources and tools"}'::jsonb,
 ARRAY[4]),

('Local Events & Market Guide', '1500-2500 words',
 ARRAY['Event overview and importance', 'Upcoming events calendar', 'Featured vendors preview', 'Visitor tips and what to expect', 'Parking and logistics', 'Similar online alternatives', 'Follow-up shopping suggestions'],
 '{"title_format": "[Event Keyword] Chicago [Year] - Complete Local Guide", "meta_description_length": "150-160 characters", "header_structure": "H1, H2, H3 with event and location keywords", "internal_links": "Link to vendor profiles and marketplace", "external_links": "Link to event websites and local resources"}'::jsonb,
 ARRAY[3]),

('Industry Insights & Thought Leadership', '2000-3500 words',
 ARRAY['Current state of the topic', 'Why this matters now', 'Data and research insights', 'Local Chicago perspective', 'Future predictions', 'Actionable recommendations', 'Community call-to-action'],
 '{"title_format": "[Topic Keyword]: The Complete Guide for Chicago [Year]", "meta_description_length": "150-160 characters", "header_structure": "H1, H2, H3 with authority keywords", "internal_links": "Link to relevant marketplace content", "external_links": "Link to research sources and industry reports"}'::jsonb,
 ARRAY[1, 7]);

-- Insert content calendar data
INSERT INTO public.blog_content_calendar (month_name, focus_theme, priority_keywords, seasonal_events, target_posts_count) VALUES
('january', 'New Year, Winter Crafts, Organization', ARRAY['handmade Valentine''s gifts near me', 'winter handmade gifts', 'handmade organization products', 'best crafts to sell in 2025'], ARRAY['New Year', 'Winter Season', 'Planning'], 4),
('february', 'Valentine''s Day, Love-themed gifts', ARRAY['handmade Valentine''s gifts near me', 'romantic handmade gifts', 'love themed crafts', 'couple gift ideas handmade'], ARRAY['Valentine''s Day', 'Presidents Day'], 4),
('march', 'Spring preparation, Easter, Women''s History', ARRAY['spring handmade gifts', 'Easter crafts local', 'women artisans Chicago', 'spring home decor handmade'], ARRAY['Spring Equinox', 'Easter', 'Women''s History Month'], 4),
('april', 'Earth Day, Spring events, Wedding season begins', ARRAY['eco friendly handmade gifts', 'sustainable crafts', 'spring craft fairs near me', 'handmade wedding gifts local'], ARRAY['Earth Day', 'Easter', 'Spring Events'], 4),
('may', 'Mother''s Day, Graduation, Wedding season', ARRAY['handmade Mother''s Day gift ideas', 'graduation gifts handmade', 'spring wedding gifts', 'farmers market vendors near me'], ARRAY['Mother''s Day', 'Graduation Season', 'Memorial Day'], 4),
('june', 'Father''s Day, Summer prep, Graduations', ARRAY['handmade Father''s Day gift ideas', 'summer handmade gifts', 'graduation gift guide', 'outdoor craft fairs Chicago'], ARRAY['Father''s Day', 'Summer Solstice', 'Wedding Season'], 4),
('july', 'Summer activities, Patriotic themes, Outdoor events', ARRAY['summer craft fairs near me', 'patriotic handmade gifts', 'outdoor market vendors', 'summer home decor handmade'], ARRAY['Independence Day', 'Summer Festivals'], 4),
('august', 'Back to school, Late summer events, Teacher gifts', ARRAY['handmade gifts for teachers', 'back to school crafts', 'late summer craft fairs', 'teacher appreciation gifts'], ARRAY['Back to School', 'Late Summer Events'], 4),
('september', 'Fall preparation, Harvest themes, Back to school', ARRAY['fall handmade gifts', 'harvest themed crafts', 'autumn home decor', 'back to school teacher gifts'], ARRAY['Labor Day', 'Fall Equinox', 'Harvest Season'], 4),
('october', 'Halloween, Fall festivals, Holiday prep begins', ARRAY['Halloween handmade crafts', 'fall craft fairs near me', 'autumn gift ideas', 'holiday market preparation'], ARRAY['Halloween', 'Fall Festivals', 'Columbus Day'], 4),
('november', 'Thanksgiving, Black Friday alternatives, Holiday shopping begins', ARRAY['handmade Christmas gifts near me', 'local holiday gift guide', 'Thanksgiving handmade crafts', 'small business Saturday gifts'], ARRAY['Thanksgiving', 'Black Friday', 'Small Business Saturday'], 5),
('december', 'Christmas, Hanukkah, Year-end, Last-minute gifts', ARRAY['last minute handmade gifts', 'local holiday markets near me', 'Christmas craft fairs Chicago', 'handmade New Year gifts'], ARRAY['Christmas', 'Hanukkah', 'New Year''s Eve'], 5);

-- Add comments to tables
COMMENT ON TABLE public.blog_keyword_clusters IS 'Stores keyword clusters for blog content organization and strategy';
COMMENT ON TABLE public.blog_keywords IS 'Stores individual keywords with metadata for blog content generation';
COMMENT ON TABLE public.blog_post_templates IS 'Stores blog post templates for different content types';
COMMENT ON TABLE public.blog_content_calendar IS 'Stores seasonal content planning data for each month';

-- Add helpful views for common queries
CREATE VIEW public.seasonal_keywords AS
SELECT 
  k.*,
  c.name as cluster_name,
  c.search_intent,
  c.content_type as cluster_content_type
FROM public.blog_keywords k
JOIN public.blog_keyword_clusters c ON k.cluster_id = c.cluster_id
WHERE k.seasonal = true
ORDER BY k.priority_score DESC, k.search_volume DESC;

CREATE VIEW public.high_priority_keywords AS
SELECT 
  k.*,
  c.name as cluster_name,
  c.search_intent
FROM public.blog_keywords k
JOIN public.blog_keyword_clusters c ON k.cluster_id = c.cluster_id
WHERE k.priority_score >= 70
ORDER BY k.priority_score DESC, k.search_volume DESC;

CREATE VIEW public.unused_keywords AS
SELECT 
  k.*,
  c.name as cluster_name
FROM public.blog_keywords k
JOIN public.blog_keyword_clusters c ON k.cluster_id = c.cluster_id
WHERE k.last_used_at IS NULL OR k.last_used_at < (NOW() - INTERVAL '90 days')
ORDER BY k.priority_score DESC, k.search_volume DESC;

-- Grant permissions for views
GRANT SELECT ON public.seasonal_keywords TO anon, authenticated;
GRANT SELECT ON public.high_priority_keywords TO anon, authenticated;
GRANT SELECT ON public.unused_keywords TO anon, authenticated;
