-- Performance Optimization: Add indexes for common query patterns

-- Listings table indexes
CREATE INDEX IF NOT EXISTS idx_listings_city_id_status ON public.listings(city_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_category_id_status ON public.listings(category_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_seller_id_status ON public.listings(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_featured_status ON public.listings(featured, status) WHERE featured = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_ready_today ON public.listings(ready_today, status) WHERE ready_today = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id_status ON public.orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id_status ON public.orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_seller ON public.profiles(is_seller) WHERE is_seller = true;
CREATE INDEX IF NOT EXISTS idx_profiles_seller_verified ON public.profiles(seller_verified) WHERE seller_verified = true;

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id_rating ON public.reviews(reviewed_user_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON public.messages(listing_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_city_id_slug ON public.categories(city_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id) WHERE parent_id IS NOT NULL;

-- Listing analytics indexes
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_date ON public.listing_analytics(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON public.listing_analytics(event_type);

-- Search analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON public.search_analytics(user_id);

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status, created_at DESC);