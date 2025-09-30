-- Create blog_articles table for SEO-rich blog content
CREATE TABLE public.blog_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  featured_image TEXT,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  publish_date TIMESTAMP WITH TIME ZONE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_prompt TEXT,
  seo_score INTEGER NOT NULL DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
  readability_score INTEGER NOT NULL DEFAULT 0 CHECK (readability_score >= 0 AND readability_score <= 100),
  word_count INTEGER NOT NULL DEFAULT 0,
  estimated_reading_time INTEGER NOT NULL DEFAULT 0,
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_article_templates table for AI-powered article generation
CREATE TABLE public.blog_article_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('guide', 'comparison', 'listicle', 'local_spotlight', 'seasonal', 'faq', 'how_to')),
  prompt_template TEXT NOT NULL,
  target_word_count INTEGER NOT NULL DEFAULT 1000,
  seo_focus TEXT[] NOT NULL DEFAULT '{}',
  required_sections TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual', 'expert', 'conversational')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_seo_keywords table for high-ranking keyword tracking
CREATE TABLE public.blog_seo_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  search_volume INTEGER,
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  category TEXT,
  related_keywords TEXT[] DEFAULT '{}',
  city_specific BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_analytics table for tracking article performance
CREATE TABLE public.blog_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  avg_time_on_page INTEGER NOT NULL DEFAULT 0,
  bounce_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  referral_sources JSONB DEFAULT '{}'::jsonb,
  conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  signups_attributed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, date)
);

-- Add webhook_sent_at and related columns to social_media_posts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_media_posts'
    AND column_name = 'webhook_sent_at'
  ) THEN
    ALTER TABLE public.social_media_posts
    ADD COLUMN webhook_sent_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN webhook_response JSONB;
  END IF;
END $$;

-- Add campaign_day and post_theme columns for 30-day campaign tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_media_posts'
    AND column_name = 'campaign_day'
  ) THEN
    ALTER TABLE public.social_media_posts
    ADD COLUMN campaign_day INTEGER,
    ADD COLUMN post_theme TEXT,
    ADD COLUMN auto_generated BOOLEAN DEFAULT false,
    ADD COLUMN short_description TEXT,
    ADD COLUMN long_description TEXT;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_article_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_articles
CREATE POLICY "Anyone can view published blog articles"
ON public.blog_articles
FOR SELECT
USING (status = 'published' AND (publish_date IS NULL OR publish_date <= now()));

CREATE POLICY "Admins can manage blog articles"
ON public.blog_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- Create policies for blog_article_templates
CREATE POLICY "Admins can view templates"
ON public.blog_article_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

CREATE POLICY "Admins can manage templates"
ON public.blog_article_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- Create policies for blog_seo_keywords
CREATE POLICY "Admins can view keywords"
ON public.blog_seo_keywords
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

CREATE POLICY "Admins can manage keywords"
ON public.blog_seo_keywords
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- Create policies for blog_analytics
CREATE POLICY "Admins can view analytics"
ON public.blog_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

CREATE POLICY "System can update analytics"
ON public.blog_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can modify analytics"
ON public.blog_analytics
FOR UPDATE
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_blog_articles_updated_at
BEFORE UPDATE ON public.blog_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_article_templates_updated_at
BEFORE UPDATE ON public.blog_article_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);
CREATE INDEX idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX idx_blog_articles_publish_date ON public.blog_articles(publish_date) WHERE publish_date IS NOT NULL;
CREATE INDEX idx_blog_articles_city ON public.blog_articles(city_id) WHERE city_id IS NOT NULL;
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category);
CREATE INDEX idx_blog_articles_tags ON public.blog_articles USING GIN(tags);
CREATE INDEX idx_blog_articles_keywords ON public.blog_articles USING GIN(keywords);
CREATE INDEX idx_blog_articles_author ON public.blog_articles(author_id);

CREATE INDEX idx_blog_templates_type ON public.blog_article_templates(template_type);
CREATE INDEX idx_blog_templates_active ON public.blog_article_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_blog_keywords_keyword ON public.blog_seo_keywords(keyword);
CREATE INDEX idx_blog_keywords_city_specific ON public.blog_seo_keywords(city_specific);

CREATE INDEX idx_blog_analytics_article ON public.blog_analytics(article_id);
CREATE INDEX idx_blog_analytics_date ON public.blog_analytics(date DESC);

-- Create function to update blog article view count
CREATE OR REPLACE FUNCTION increment_blog_view_count(article_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blog_articles
  SET view_count = view_count + 1
  WHERE slug = article_slug AND status = 'published';
END;
$$;

-- Create function to calculate SEO score
CREATE OR REPLACE FUNCTION calculate_blog_seo_score(
  p_title TEXT,
  p_meta_title TEXT,
  p_meta_description TEXT,
  p_keywords TEXT[],
  p_content TEXT,
  p_featured_image TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  score INTEGER := 0;
  word_count INTEGER;
BEGIN
  -- Title optimization (0-25 points)
  IF LENGTH(p_meta_title) >= 30 AND LENGTH(p_meta_title) <= 60 THEN
    score := score + 25;
  ELSIF LENGTH(p_meta_title) > 0 THEN
    score := score + 15;
  END IF;

  -- Meta description (0-25 points)
  IF LENGTH(p_meta_description) >= 120 AND LENGTH(p_meta_description) <= 160 THEN
    score := score + 25;
  ELSIF LENGTH(p_meta_description) > 0 THEN
    score := score + 15;
  END IF;

  -- Keywords (0-20 points)
  IF array_length(p_keywords, 1) >= 3 THEN
    score := score + 20;
  ELSIF array_length(p_keywords, 1) > 0 THEN
    score := score + 10;
  END IF;

  -- Content length (0-20 points)
  word_count := array_length(string_to_array(p_content, ' '), 1);
  IF word_count >= 800 THEN
    score := score + 20;
  ELSIF word_count >= 500 THEN
    score := score + 15;
  ELSIF word_count >= 300 THEN
    score := score + 10;
  END IF;

  -- Featured image (0-10 points)
  IF p_featured_image IS NOT NULL AND LENGTH(p_featured_image) > 0 THEN
    score := score + 10;
  END IF;

  RETURN score;
END;
$$;

-- Insert default blog article templates
INSERT INTO public.blog_article_templates (
  name,
  description,
  template_type,
  prompt_template,
  target_word_count,
  seo_focus,
  required_sections,
  tone,
  is_active
) VALUES
(
  'Local Gift Guide',
  'Generate city-specific gift guides featuring local artisans and handmade products',
  'guide',
  'Create a comprehensive gift guide for {city} featuring handmade items under ${price_range}. Focus on {category} from local artisans. Include seasonal relevance for {season}. Target the keyword "{target_keyword}" naturally throughout. Emphasize supporting local makers and the unique stories behind their crafts. Include specific product recommendations with price points and where to find them on CraftLocal marketplace.',
  1200,
  ARRAY['local gifts', 'handmade gifts', 'city name', 'artisan gifts', 'shop local'],
  ARRAY['Introduction', 'Why Shop Local Handmade Gifts', 'Featured Products', 'Local Artisan Spotlights', 'Shopping Tips', 'Price Guide', 'Where to Buy', 'Conclusion with Call-to-Action'],
  'friendly',
  true
),
(
  'Marketplace Comparison',
  'Compare CraftLocal with other online marketplaces, highlighting local focus',
  'comparison',
  'Write a detailed comparison between CraftLocal and {competitor} focusing on {comparison_points}. Highlight benefits for {audience} in {city}. Target keyword: "{target_keyword}". Emphasize CraftLocal''s focus on local artisans, community building, lower fees for makers, and authentic handmade verification. Include pricing comparison, seller support, buyer experience, and local impact. Be objective but emphasize the value of supporting local.',
  1800,
  ARRAY['marketplace comparison', 'vs competitor', 'local marketplace', 'artisan platform', 'handmade marketplace'],
  ARRAY['Overview', 'Platform Philosophy', 'Feature Comparison', 'Pricing Analysis', 'Seller Support', 'Buyer Experience', 'Local Impact', 'Community Features', 'Recommendation'],
  'professional',
  true
),
(
  'Care & Maintenance Guide',
  'Create detailed care guides for handmade products to increase customer confidence',
  'how_to',
  'Write a comprehensive care guide for {product_type} made from {material}. Target keyword: "{target_keyword}". Include cleaning, storage, maintenance tips, and troubleshooting common issues. Emphasize the value of handmade items and how proper care preserves their quality and extends their life. Include expert tips from local artisans and recommendations for professional care when needed.',
  1000,
  ARRAY['product care', 'maintenance tips', 'how to care', 'handmade care', 'preservation guide'],
  ARRAY['Introduction', 'Daily Care Routine', 'Deep Cleaning Methods', 'Storage Best Practices', 'Seasonal Maintenance', 'Troubleshooting Common Issues', 'When to Seek Professional Care', 'Conclusion'],
  'expert',
  true
),
(
  'Local Artisan Spotlight',
  'Feature local makers and their stories to drive marketplace awareness',
  'local_spotlight',
  'Create an engaging profile of a local artisan in {city}. Focus on their craft ({craft_type}), creative journey, unique techniques, and what makes their work special. Target keyword: "{target_keyword}". Include their background, inspiration, production process, best-selling products, and why shopping from them supports the local community. Include a call-to-action to visit their CraftLocal shop and sign up as a buyer or seller.',
  800,
  ARRAY['local artisan', 'maker story', 'city artisan', 'craft profile', 'handmade maker'],
  ARRAY['Artisan Introduction', 'The Craft Journey', 'Unique Techniques & Materials', 'Featured Products', 'Behind the Scenes', 'Community Impact', 'Shop Information', 'Call-to-Action'],
  'conversational',
  true
),
(
  'Seasonal Craft Trends',
  'Analyze and predict seasonal craft trends to drive traffic and engagement',
  'listicle',
  'Write about the top {number} craft trends for {season} {year}. Focus on the {city} market and local artisan perspectives. Target keyword: "{target_keyword}". Include trend analysis, why each trend is popular, local makers leading the trend, where to shop for trendy items, and price ranges. Emphasize discovering these trends on CraftLocal marketplace and supporting local makers. Include a call-to-action for both buyers and potential sellers.',
  1400,
  ARRAY['craft trends', 'seasonal trends', 'year trends', 'local trends', 'handmade trends'],
  ARRAY['Trend Overview', 'Top Trends List with Details', 'Local Market Analysis', 'Featured Makers', 'Shopping Guide', 'Price Points', 'Future Predictions', 'Call-to-Action'],
  'friendly',
  true
),
(
  'Seller Success Guide',
  'Educational content to attract new sellers to the marketplace',
  'guide',
  'Create a comprehensive guide for artisans looking to sell their {craft_type} on CraftLocal in {city}. Target keyword: "{target_keyword}". Cover getting started, setting up a shop, pricing strategies, photography tips, marketing, customer service, and success stories from local makers. Emphasize low fees, local community support, and tools available to sellers. Include strong call-to-action to sign up as a seller.',
  1500,
  ARRAY['sell handmade', 'marketplace seller', 'artisan business', 'craft business', 'online selling'],
  ARRAY['Why Sell on CraftLocal', 'Getting Started', 'Shop Setup Guide', 'Pricing Your Products', 'Product Photography', 'Marketing Your Shop', 'Customer Service Tips', 'Success Stories', 'Sign Up Call-to-Action'],
  'professional',
  true
),
(
  'Buyer''s Guide FAQ',
  'Answer common buyer questions to reduce friction and increase conversions',
  'faq',
  'Create a comprehensive FAQ guide for buyers shopping for {product_category} on CraftLocal in {city}. Target keyword: "{target_keyword}". Answer questions about shipping, returns, product authenticity, supporting local, payment security, custom orders, and more. Build trust and remove barriers to purchase. Include strong call-to-action to browse the marketplace and sign up.',
  1000,
  ARRAY['buying guide', 'shopping questions', 'marketplace faq', 'handmade shopping'],
  ARRAY['Introduction', 'About CraftLocal', 'Product Questions', 'Ordering & Shipping', 'Returns & Exchanges', 'Payment & Security', 'Supporting Local Artisans', 'Custom Orders', 'Getting Started'],
  'friendly',
  true
);

-- Insert sample high-ranking SEO keywords
INSERT INTO public.blog_seo_keywords (keyword, search_volume, difficulty_score, category, city_specific) VALUES
('handmade gifts near me', 8100, 45, 'Shopping', true),
('local artisan markets', 5400, 52, 'Events', true),
('where to buy handmade jewelry', 6600, 48, 'Shopping', false),
('craft marketplace online', 3600, 58, 'Marketplace', false),
('support local artisans', 2900, 35, 'Community', false),
('handmade pottery care', 2400, 28, 'Education', false),
('best handmade gifts under $50', 4800, 42, 'Shopping', false),
('how to sell handmade crafts online', 9100, 65, 'Seller', false),
('local craft fairs', 12100, 48, 'Events', true),
('unique handmade home decor', 5800, 51, 'Shopping', false);