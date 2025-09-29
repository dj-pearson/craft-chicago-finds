-- Add remaining tables that don't exist yet

-- Product bundles (bundle products together)
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  bundle_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bundle items (items within product bundles)
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(bundle_id, listing_id)
);

-- Custom order chats (custom order messaging system)
CREATE TABLE IF NOT EXISTS public.custom_order_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'quoted', 'accepted', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seller profiles (extended seller profile information)
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  business_description TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  tax_id TEXT,
  business_license TEXT,
  years_in_business INTEGER,
  specialties TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  awards TEXT[] DEFAULT '{}',
  story TEXT,
  process_description TEXT,
  materials_used TEXT[] DEFAULT '{}',
  shipping_policy TEXT,
  return_policy TEXT,
  custom_order_available BOOLEAN DEFAULT false,
  min_custom_order_amount DECIMAL(10,2),
  lead_time_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog posts (blog/content management system)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
DO $$
BEGIN
  -- Only enable RLS if table exists and RLS is not already enabled
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'product_bundles') THEN
    ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bundle_items') THEN
    ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'custom_order_chats') THEN
    ALTER TABLE public.custom_order_chats ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'seller_profiles') THEN
    ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'blog_posts') THEN
    ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for new tables (only if they don't exist)

-- Product bundles policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_bundles' AND policyname = 'Anyone can view active bundles') THEN
    CREATE POLICY "Anyone can view active bundles" ON public.product_bundles FOR SELECT USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_bundles' AND policyname = 'Sellers can manage their own bundles') THEN
    CREATE POLICY "Sellers can manage their own bundles" ON public.product_bundles FOR ALL USING (auth.uid() = seller_id);
  END IF;
END $$;

-- Bundle items policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundle_items' AND policyname = 'Anyone can view bundle items for active bundles') THEN
    CREATE POLICY "Anyone can view bundle items for active bundles" ON public.bundle_items FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.product_bundles WHERE id = bundle_id AND is_active = true)
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundle_items' AND policyname = 'Bundle owners can manage bundle items') THEN
    CREATE POLICY "Bundle owners can manage bundle items" ON public.bundle_items FOR ALL USING (
      EXISTS (SELECT 1 FROM public.product_bundles WHERE id = bundle_id AND seller_id = auth.uid())
    );
  END IF;
END $$;

-- Custom order chats policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_order_chats' AND policyname = 'Users can view their own custom order chats') THEN
    CREATE POLICY "Users can view their own custom order chats" ON public.custom_order_chats FOR SELECT USING (
      auth.uid() = buyer_id OR auth.uid() = seller_id
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_order_chats' AND policyname = 'Users can manage their own custom order chats') THEN
    CREATE POLICY "Users can manage their own custom order chats" ON public.custom_order_chats FOR ALL USING (
      auth.uid() = buyer_id OR auth.uid() = seller_id
    );
  END IF;
END $$;

-- Seller profiles policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seller_profiles' AND policyname = 'Anyone can view seller profiles') THEN
    CREATE POLICY "Anyone can view seller profiles" ON public.seller_profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seller_profiles' AND policyname = 'Sellers can manage their own profiles') THEN
    CREATE POLICY "Sellers can manage their own profiles" ON public.seller_profiles FOR ALL USING (auth.uid() = seller_id);
  END IF;
END $$;

-- Blog posts policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Anyone can view published blog posts') THEN
    CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts FOR SELECT USING (is_published = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Authors can manage their own blog posts') THEN
    CREATE POLICY "Authors can manage their own blog posts" ON public.blog_posts FOR ALL USING (auth.uid() = author_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_bundles_seller ON public.product_bundles(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_active ON public.product_bundles(is_active);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON public.bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_listing ON public.bundle_items(listing_id);

CREATE INDEX IF NOT EXISTS idx_custom_order_chats_buyer ON public.custom_order_chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_chats_seller ON public.custom_order_chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_chats_status ON public.custom_order_chats(status);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_seller ON public.seller_profiles(seller_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(is_featured);

-- Add triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_bundles_updated_at') THEN
    CREATE TRIGGER update_product_bundles_updated_at
    BEFORE UPDATE ON public.product_bundles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_custom_order_chats_updated_at') THEN
    CREATE TRIGGER update_custom_order_chats_updated_at
    BEFORE UPDATE ON public.custom_order_chats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_seller_profiles_updated_at') THEN
    CREATE TRIGGER update_seller_profiles_updated_at
    BEFORE UPDATE ON public.seller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_posts_updated_at') THEN
    CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
