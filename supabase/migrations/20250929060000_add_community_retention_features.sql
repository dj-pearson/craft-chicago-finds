-- Add community and retention features to the marketplace

-- Table for shop follows
CREATE TABLE IF NOT EXISTS public.shop_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{"new_items": true, "sales": false, "updates": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, shop_owner_id)
);

-- Table for collections (by creators/tastemakers)
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  category TEXT CHECK (category IN ('curated', 'seasonal', 'trending', 'gift_guide', 'style', 'occasion', 'custom')),
  sort_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  follow_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for collection items
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, listing_id)
);

-- Table for collection follows
CREATE TABLE IF NOT EXISTS public.collection_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{"new_items": true, "updates": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, collection_id)
);

-- Table for shared wishlists
CREATE TABLE IF NOT EXISTS public.shared_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  share_token TEXT NOT NULL UNIQUE, -- For secure sharing without login
  expires_at TIMESTAMP WITH TIME ZONE,
  occasion TEXT, -- birthday, holiday, wedding, etc.
  target_date DATE, -- when the occasion is
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  view_count INTEGER DEFAULT 0,
  contributor_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  purchased_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for wishlist items
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.shared_wishlists(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5), -- 1 = low, 5 = high
  quantity_wanted INTEGER DEFAULT 1,
  quantity_purchased INTEGER DEFAULT 0,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES auth.users(id),
  purchased_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wishlist_id, listing_id)
);

-- Table for wishlist contributors (people who can add items)
CREATE TABLE IF NOT EXISTS public.wishlist_contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.shared_wishlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'contributor', 'viewer')),
  can_add_items BOOLEAN DEFAULT TRUE,
  can_edit_items BOOLEAN DEFAULT FALSE,
  can_remove_items BOOLEAN DEFAULT FALSE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wishlist_id, user_id)
);

-- Table for email digest preferences and tracking
CREATE TABLE IF NOT EXISTS public.email_digest_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('shop_follows', 'collections', 'weekly_digest', 'monthly_summary')),
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'never')),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, digest_type)
);

-- Table for tracking digest emails sent
CREATE TABLE IF NOT EXISTS public.email_digest_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL,
  content_summary JSONB, -- Summary of what was included
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_provider_id TEXT, -- External email service ID
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'))
);

-- Enable RLS on all new tables
ALTER TABLE public.shop_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_digest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_digest_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for shop_follows
CREATE POLICY "Users can manage their own shop follows" 
ON public.shop_follows 
FOR ALL 
USING (auth.uid() = follower_id);

CREATE POLICY "Shop owners can view their followers" 
ON public.shop_follows 
FOR SELECT 
USING (auth.uid() = shop_owner_id);

CREATE POLICY "Public can view follow counts" 
ON public.shop_follows 
FOR SELECT 
USING (true);

-- Create policies for collections
CREATE POLICY "Anyone can view public collections" 
ON public.collections 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can manage their own collections" 
ON public.collections 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all collections" 
ON public.collections 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create policies for collection_items
CREATE POLICY "Anyone can view items in public collections" 
ON public.collection_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE id = collection_id AND is_public = true
  )
);

CREATE POLICY "Collection creators can manage collection items" 
ON public.collection_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE id = collection_id AND creator_id = auth.uid()
  )
);

-- Create policies for collection_follows
CREATE POLICY "Users can manage their own collection follows" 
ON public.collection_follows 
FOR ALL 
USING (auth.uid() = follower_id);

CREATE POLICY "Collection creators can view their followers" 
ON public.collection_follows 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE id = collection_id AND creator_id = auth.uid()
  )
);

-- Create policies for shared_wishlists
CREATE POLICY "Anyone can view public wishlists" 
ON public.shared_wishlists 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view wishlists they created or contribute to" 
ON public.shared_wishlists 
FOR SELECT 
USING (
  auth.uid() = creator_id OR 
  EXISTS (
    SELECT 1 FROM public.wishlist_contributors 
    WHERE wishlist_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own wishlists" 
ON public.shared_wishlists 
FOR ALL 
USING (auth.uid() = creator_id);

-- Create policies for wishlist_items
CREATE POLICY "Anyone can view items in public wishlists" 
ON public.wishlist_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_wishlists 
    WHERE id = wishlist_id AND is_public = true
  )
);

CREATE POLICY "Wishlist contributors can manage items" 
ON public.wishlist_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.wishlist_contributors 
    WHERE wishlist_id = wishlist_items.wishlist_id 
    AND user_id = auth.uid()
    AND (
      role = 'owner' OR 
      (role = 'contributor' AND can_add_items = true)
    )
  )
);

-- Create policies for wishlist_contributors
CREATE POLICY "Wishlist owners can manage contributors" 
ON public.wishlist_contributors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_wishlists 
    WHERE id = wishlist_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Contributors can view their own access" 
ON public.wishlist_contributors 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policies for email preferences
CREATE POLICY "Users can manage their own email preferences" 
ON public.email_digest_preferences 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own email logs" 
ON public.email_digest_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" 
ON public.email_digest_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_follows_follower ON public.shop_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_shop_follows_shop_owner ON public.shop_follows(shop_owner_id);
CREATE INDEX IF NOT EXISTS idx_shop_follows_created ON public.shop_follows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collections_creator ON public.collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_collections_category ON public.collections(category);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_listing ON public.collection_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_sort ON public.collection_items(collection_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_collection_follows_follower ON public.collection_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_collection_follows_collection ON public.collection_follows(collection_id);

CREATE INDEX IF NOT EXISTS idx_shared_wishlists_creator ON public.shared_wishlists(creator_id);
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_public ON public.shared_wishlists(is_public);
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_slug ON public.shared_wishlists(slug);
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_share_token ON public.shared_wishlists(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_target_date ON public.shared_wishlists(target_date);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_listing ON public.wishlist_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_sort ON public.wishlist_items(wishlist_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_priority ON public.wishlist_items(wishlist_id, priority DESC);

CREATE INDEX IF NOT EXISTS idx_wishlist_contributors_wishlist ON public.wishlist_contributors(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_contributors_user ON public.wishlist_contributors(user_id);

CREATE INDEX IF NOT EXISTS idx_email_digest_preferences_user ON public.email_digest_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digest_preferences_type ON public.email_digest_preferences(digest_type);

CREATE INDEX IF NOT EXISTS idx_email_digest_logs_user ON public.email_digest_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digest_logs_sent ON public.email_digest_logs(sent_at DESC);

-- Add triggers for updated_at columns
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_wishlists_updated_at
BEFORE UPDATE ON public.shared_wishlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_digest_preferences_updated_at
BEFORE UPDATE ON public.email_digest_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get shop follow count
CREATE OR REPLACE FUNCTION public.get_shop_follow_count(shop_owner_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.shop_follows
  WHERE shop_owner_id = shop_owner_uuid;
$$;

-- Function to check if user follows a shop
CREATE OR REPLACE FUNCTION public.is_following_shop(shop_owner_uuid UUID, follower_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.shop_follows
    WHERE shop_owner_id = shop_owner_uuid AND follower_id = follower_uuid
  );
$$;

-- Function to get collection follow count
CREATE OR REPLACE FUNCTION public.get_collection_follow_count(collection_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.collection_follows
  WHERE collection_id = collection_uuid;
$$;

-- Function to check if user follows a collection
CREATE OR REPLACE FUNCTION public.is_following_collection(collection_uuid UUID, follower_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.collection_follows
    WHERE collection_id = collection_uuid AND follower_id = follower_uuid
  );
$$;

-- Function to update collection counts
CREATE OR REPLACE FUNCTION public.update_collection_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update item count
    UPDATE public.collections 
    SET item_count = item_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
    
    -- Update follow count if it's a follow
    IF TG_TABLE_NAME = 'collection_follows' THEN
      UPDATE public.collections 
      SET follow_count = follow_count + 1,
          updated_at = NOW()
      WHERE id = NEW.collection_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update item count
    UPDATE public.collections 
    SET item_count = GREATEST(0, item_count - 1),
        updated_at = NOW()
    WHERE id = OLD.collection_id;
    
    -- Update follow count if it's a follow
    IF TG_TABLE_NAME = 'collection_follows' THEN
      UPDATE public.collections 
      SET follow_count = GREATEST(0, follow_count - 1),
          updated_at = NOW()
      WHERE id = OLD.collection_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to update wishlist counts
CREATE OR REPLACE FUNCTION public.update_wishlist_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_val DECIMAL(10,2);
  purchased_val DECIMAL(10,2);
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Calculate totals
    SELECT 
      COALESCE(SUM(l.price * wi.quantity_wanted), 0),
      COALESCE(SUM(l.price * wi.quantity_purchased), 0)
    INTO total_val, purchased_val
    FROM public.wishlist_items wi
    JOIN public.listings l ON wi.listing_id = l.id
    WHERE wi.wishlist_id = COALESCE(NEW.wishlist_id, OLD.wishlist_id);
    
    -- Update wishlist
    UPDATE public.shared_wishlists 
    SET 
      item_count = (
        SELECT COUNT(*) 
        FROM public.wishlist_items 
        WHERE wishlist_id = COALESCE(NEW.wishlist_id, OLD.wishlist_id)
      ),
      total_value = total_val,
      purchased_value = purchased_val,
      updated_at = NOW()
    WHERE id = COALESCE(NEW.wishlist_id, OLD.wishlist_id);
    
    RETURN COALESCE(NEW, OLD);
  ELSIF TG_OP = 'DELETE' THEN
    -- Calculate totals
    SELECT 
      COALESCE(SUM(l.price * wi.quantity_wanted), 0),
      COALESCE(SUM(l.price * wi.quantity_purchased), 0)
    INTO total_val, purchased_val
    FROM public.wishlist_items wi
    JOIN public.listings l ON wi.listing_id = l.id
    WHERE wi.wishlist_id = OLD.wishlist_id;
    
    -- Update wishlist
    UPDATE public.shared_wishlists 
    SET 
      item_count = GREATEST(0, item_count - 1),
      total_value = total_val,
      purchased_value = purchased_val,
      updated_at = NOW()
    WHERE id = OLD.wishlist_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for count updates
CREATE TRIGGER update_collection_item_counts
AFTER INSERT OR DELETE ON public.collection_items
FOR EACH ROW
EXECUTE FUNCTION public.update_collection_counts();

CREATE TRIGGER update_collection_follow_counts
AFTER INSERT OR DELETE ON public.collection_follows
FOR EACH ROW
EXECUTE FUNCTION public.update_collection_counts();

CREATE TRIGGER update_wishlist_item_counts
AFTER INSERT OR UPDATE OR DELETE ON public.wishlist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_wishlist_counts();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_text TEXT, table_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
BEGIN
  -- Create base slug
  slug := regexp_replace(lower(trim(base_text)), '[^a-z0-9]+', '-', 'g');
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');
  
  final_slug := slug;
  
  -- Check for uniqueness and add counter if needed
  LOOP
    CASE table_name
      WHEN 'collections' THEN
        IF NOT EXISTS (SELECT 1 FROM public.collections WHERE slug = final_slug) THEN
          EXIT;
        END IF;
      WHEN 'shared_wishlists' THEN
        IF NOT EXISTS (SELECT 1 FROM public.shared_wishlists WHERE slug = final_slug) THEN
          EXIT;
        END IF;
    END CASE;
    
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to get featured collections
CREATE OR REPLACE FUNCTION public.get_featured_collections(collection_limit INTEGER DEFAULT 6)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  slug TEXT,
  cover_image_url TEXT,
  creator_name TEXT,
  item_count INTEGER,
  follow_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.title,
    c.description,
    c.slug,
    c.cover_image_url,
    p.display_name,
    c.item_count,
    c.follow_count,
    c.created_at
  FROM public.collections c
  JOIN public.profiles p ON c.creator_id = p.user_id
  WHERE c.is_public = true AND c.is_featured = true
  ORDER BY c.follow_count DESC, c.created_at DESC
  LIMIT collection_limit;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.shop_follows TO anon, authenticated;
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT SELECT ON public.collection_items TO anon, authenticated;
GRANT SELECT ON public.collection_follows TO anon, authenticated;
GRANT SELECT ON public.shared_wishlists TO anon, authenticated;
GRANT SELECT ON public.wishlist_items TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_shop_follow_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_shop(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_collection_follow_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_collection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_collections(INTEGER) TO anon, authenticated;
