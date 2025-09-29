-- Create missing database functions from ToDoItems.md

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

-- Function to get user's favorite listings
CREATE OR REPLACE FUNCTION public.get_user_favorites(user_uuid UUID DEFAULT auth.uid(), fav_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  seller_name TEXT,
  favorited_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    p.display_name,
    f.created_at
  FROM public.user_favorites f
  JOIN public.listings l ON f.listing_id = l.id
  LEFT JOIN public.profiles p ON l.seller_id = p.user_id
  WHERE f.user_id = user_uuid
    AND l.status = 'active'
  ORDER BY f.created_at DESC
  LIMIT fav_limit;
$$;

-- Function to get user's recent views
CREATE OR REPLACE FUNCTION public.get_user_recent_views(user_uuid UUID DEFAULT auth.uid(), view_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  seller_name TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    p.display_name,
    rv.viewed_at
  FROM public.user_recent_views rv
  JOIN public.listings l ON rv.listing_id = l.id
  LEFT JOIN public.profiles p ON l.seller_id = p.user_id
  WHERE rv.user_id = user_uuid
    AND l.status = 'active'
  ORDER BY rv.viewed_at DESC
  LIMIT view_limit;
$$;

-- Function to get featured collections
DROP FUNCTION IF EXISTS public.get_featured_collections(INTEGER);
CREATE OR REPLACE FUNCTION public.get_featured_collections(collection_limit INTEGER DEFAULT 6)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  slug TEXT,
  cover_image_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  category TEXT,
  item_count INTEGER,
  follow_count INTEGER,
  view_count INTEGER,
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
    c.creator_id,
    p.display_name,
    p.avatar_url,
    c.category,
    c.item_count,
    c.follow_count,
    c.view_count,
    c.created_at
  FROM public.collections c
  JOIN public.profiles p ON c.creator_id = p.user_id
  WHERE c.is_public = true AND c.is_featured = true
  ORDER BY c.follow_count DESC, c.created_at DESC
  LIMIT collection_limit;
$$;

-- Function to get seller badges
CREATE OR REPLACE FUNCTION public.get_seller_badges(seller_uuid UUID)
RETURNS TABLE (
  badge_type TEXT,
  earned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    badge_type,
    earned_at,
    expires_at
  FROM public.seller_badges
  WHERE seller_id = seller_uuid
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY earned_at DESC;
$$;

-- Function to calculate seller metrics for badges
CREATE OR REPLACE FUNCTION public.calculate_seller_metrics(seller_uuid UUID, days_back INTEGER DEFAULT 90)
RETURNS TABLE (
  total_orders INTEGER,
  avg_rating DECIMAL(3,2),
  on_time_delivery_rate DECIMAL(5,2),
  response_time_hours DECIMAL(8,2),
  return_rate DECIMAL(5,2)
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH seller_orders AS (
    SELECT 
      o.*,
      EXTRACT(EPOCH FROM (o.shipped_at - o.created_at)) / 3600 AS ship_time_hours,
      CASE 
        WHEN o.shipped_at <= (o.created_at + INTERVAL '1 day' * COALESCE(l.processing_time_days, 3) + INTERVAL '1 day' * COALESCE(l.shipping_time_days, 3))
        THEN 1 ELSE 0 
      END AS on_time
    FROM public.orders o
    JOIN public.listings l ON o.listing_id = l.id
    WHERE l.seller_id = seller_uuid
      AND o.created_at >= NOW() - INTERVAL '1 day' * days_back
      AND o.status IN ('completed', 'delivered')
  )
  SELECT 
    COALESCE(COUNT(DISTINCT so.id), 0)::INTEGER as total_orders,
    0::DECIMAL(3,2) as avg_rating, -- TODO: Calculate when reviews table exists
    COALESCE(AVG(so.on_time) * 100, 0)::DECIMAL(5,2) as on_time_delivery_rate,
    COALESCE(AVG(so.ship_time_hours), 0)::DECIMAL(8,2) as response_time_hours,
    0::DECIMAL(5,2) as return_rate -- TODO: Calculate when returns table exists
  FROM seller_orders so;
$$;

-- Function to update seller badges based on metrics
CREATE OR REPLACE FUNCTION public.update_seller_badges(seller_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metrics RECORD;
  badge_record RECORD;
BEGIN
  -- Get current metrics
  SELECT * INTO metrics FROM public.calculate_seller_metrics(seller_uuid);
  
  -- Top Rated Badge (avg rating >= 4.5, min 10 orders)
  IF metrics.avg_rating >= 4.5 AND metrics.total_orders >= 10 THEN
    INSERT INTO public.seller_badges (seller_id, badge_type, earned_at)
    VALUES (seller_uuid, 'top_rated', NOW())
    ON CONFLICT (seller_id, badge_type) 
    DO UPDATE SET is_active = true, earned_at = NOW();
  ELSE
    UPDATE public.seller_badges 
    SET is_active = false 
    WHERE seller_id = seller_uuid AND badge_type = 'top_rated';
  END IF;
  
  -- Fast Shipper Badge (on-time delivery >= 95%, min 5 orders)
  IF metrics.on_time_delivery_rate >= 95 AND metrics.total_orders >= 5 THEN
    INSERT INTO public.seller_badges (seller_id, badge_type, earned_at)
    VALUES (seller_uuid, 'fast_shipper', NOW())
    ON CONFLICT (seller_id, badge_type) 
    DO UPDATE SET is_active = true, earned_at = NOW();
  ELSE
    UPDATE public.seller_badges 
    SET is_active = false 
    WHERE seller_id = seller_uuid AND badge_type = 'fast_shipper';
  END IF;
  
  -- Add more badge logic here as needed
END;
$$;

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_text TEXT, table_name TEXT, column_name TEXT DEFAULT 'slug')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
  query_text TEXT;
  exists_result BOOLEAN;
BEGIN
  -- Create base slug
  slug := regexp_replace(lower(trim(base_text)), '[^a-z0-9]+', '-', 'g');
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');
  
  final_slug := slug;
  
  -- Check for uniqueness and add counter if needed
  LOOP
    query_text := format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name);
    EXECUTE query_text INTO exists_result USING final_slug;
    
    IF NOT exists_result THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to track listing views
CREATE OR REPLACE FUNCTION public.track_listing_view(listing_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only track for logged in users
  IF user_uuid IS NULL THEN
    RETURN;
  END IF;
  
  -- Don't track seller viewing their own listing
  IF EXISTS (SELECT 1 FROM public.listings WHERE id = listing_uuid AND seller_id = user_uuid) THEN
    RETURN;
  END IF;
  
  -- Insert or update recent view
  INSERT INTO public.user_recent_views (user_id, listing_id, viewed_at)
  VALUES (user_uuid, listing_uuid, NOW())
  ON CONFLICT (user_id, listing_id)
  DO UPDATE SET viewed_at = NOW();
  
  -- Update listing view count
  UPDATE public.listings 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = listing_uuid;
END;
$$;

-- Function to get smart recommendations based on user behavior
CREATE OR REPLACE FUNCTION public.get_smart_recommendations(user_uuid UUID DEFAULT auth.uid(), rec_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  seller_name TEXT,
  reason TEXT,
  score DECIMAL(5,2)
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH user_categories AS (
    -- Get categories from user's recent views and favorites
    SELECT c.id as category_id, COUNT(*) as interest_score
    FROM public.user_recent_views rv
    JOIN public.listings l ON rv.listing_id = l.id
    JOIN public.categories c ON l.category_id = c.id
    WHERE rv.user_id = user_uuid
      AND rv.viewed_at >= NOW() - INTERVAL '30 days'
    GROUP BY c.id
    
    UNION ALL
    
    SELECT c.id as category_id, COUNT(*) * 2 as interest_score -- Weight favorites higher
    FROM public.user_favorites f
    JOIN public.listings l ON f.listing_id = l.id
    JOIN public.categories c ON l.category_id = c.id
    WHERE f.user_id = user_uuid
    GROUP BY c.id
  ),
  category_scores AS (
    SELECT category_id, SUM(interest_score) as total_score
    FROM user_categories
    GROUP BY category_id
  ),
  recommendations AS (
    SELECT 
      l.id,
      l.title,
      l.price,
      l.images,
      p.display_name as seller_name,
      CASE 
        WHEN cs.category_id IS NOT NULL THEN 'Based on your interests'
        ELSE 'Popular item'
      END as reason,
      COALESCE(cs.total_score, 0) + (l.view_count * 0.1) as score
    FROM public.listings l
    JOIN public.profiles p ON l.seller_id = p.user_id
    LEFT JOIN category_scores cs ON l.category_id = cs.category_id
    WHERE l.status = 'active'
      AND l.seller_id != user_uuid -- Don't recommend own listings
      AND l.id NOT IN ( -- Don't recommend already viewed/favorited items
        SELECT listing_id FROM public.user_recent_views WHERE user_id = user_uuid
        UNION
        SELECT listing_id FROM public.user_favorites WHERE user_id = user_uuid
      )
    ORDER BY score DESC, l.created_at DESC
    LIMIT rec_limit
  )
  SELECT * FROM recommendations;
$$;

-- Function to get notification digest content
CREATE OR REPLACE FUNCTION public.get_digest_content(
  user_uuid UUID,
  digest_type TEXT,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  new_items_count INTEGER,
  collection_updates_count INTEGER,
  followed_shops_count INTEGER,
  content_summary JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  new_items INTEGER := 0;
  collection_updates INTEGER := 0;
  followed_shops INTEGER := 0;
  content JSONB := '{}'::jsonb;
BEGIN
  -- Get new items from followed shops
  IF digest_type IN ('shop_follows', 'weekly_digest') THEN
    SELECT COUNT(DISTINCT l.id) INTO new_items
    FROM public.shop_follows sf
    JOIN public.listings l ON sf.shop_owner_id = l.seller_id
    WHERE sf.follower_id = user_uuid
      AND l.created_at >= NOW() - INTERVAL '1 day' * days_back
      AND l.status = 'active';
      
    SELECT COUNT(DISTINCT sf.shop_owner_id) INTO followed_shops
    FROM public.shop_follows sf
    JOIN public.listings l ON sf.shop_owner_id = l.seller_id
    WHERE sf.follower_id = user_uuid
      AND l.created_at >= NOW() - INTERVAL '1 day' * days_back
      AND l.status = 'active';
  END IF;
  
  -- Get collection updates
  IF digest_type IN ('collections', 'weekly_digest') THEN
    SELECT COUNT(DISTINCT c.id) INTO collection_updates
    FROM public.collection_follows cf
    JOIN public.collections c ON cf.collection_id = c.id
    WHERE cf.follower_id = user_uuid
      AND c.updated_at >= NOW() - INTERVAL '1 day' * days_back;
  END IF;
  
  -- Build content summary
  content := jsonb_build_object(
    'new_items', new_items,
    'collection_updates', collection_updates,
    'followed_shops', followed_shops,
    'generated_at', NOW()
  );
  
  RETURN QUERY SELECT new_items, collection_updates, followed_shops, content;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.get_shop_follow_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_shop(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_collection_follow_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_collection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favorites(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recent_views(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_collections(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_badges(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_seller_metrics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_seller_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_listing_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_smart_recommendations(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_digest_content(UUID, TEXT, INTEGER) TO authenticated;
