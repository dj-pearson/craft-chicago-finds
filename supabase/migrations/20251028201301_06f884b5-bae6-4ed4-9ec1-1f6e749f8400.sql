-- CRITICAL DATABASE INDEXES FOR PERFORMANCE
-- Phase 2: Conservative approach - only existing tables
-- Estimated improvement: 50-60% faster queries

-- Orders table indexes (verified to exist)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id_created_at ON orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id_status ON orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);

-- Reviews table indexes (verified to exist)
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id_rating ON reviews(reviewed_user_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at ON reviews(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id_created_at ON reviews(reviewer_id, created_at DESC);

-- Messages table indexes (verified to exist)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages(conversation_id, created_at DESC);

-- Notifications table indexes (verified to exist)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read) WHERE read = false;

-- Listings table additional indexes (verified to exist)
CREATE INDEX IF NOT EXISTS idx_listings_seller_status ON listings(seller_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_city_featured ON listings(city_id, featured, created_at DESC) WHERE featured = true AND status = 'active';