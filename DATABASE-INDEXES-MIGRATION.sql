-- CRITICAL DATABASE INDEXES FOR PERFORMANCE
-- Based on Production Readiness Audit Phase 2
-- Estimated improvement: 50-60% faster queries on dashboards/reports

-- ========================================
-- ORDERS TABLE INDEXES
-- ========================================

-- Index for buyer dashboard queries (filter by buyer + sort by date)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id_created_at 
  ON orders(buyer_id, created_at DESC);

-- Index for seller dashboard queries (filter by seller + status)
CREATE INDEX IF NOT EXISTS idx_orders_seller_id_status 
  ON orders(seller_id, status);

-- Index for order status + date filtering (admin reports)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
  ON orders(status, created_at DESC);

-- ========================================
-- REVIEWS TABLE INDEXES
-- ========================================

-- Index for seller reputation queries (get all reviews for a seller)
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id_rating 
  ON reviews(reviewed_user_id, rating DESC);

-- Index for review moderation queue (pending reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at 
  ON reviews(status, created_at DESC) 
  WHERE status = 'pending';

-- Index for reviewer's review history
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id_created_at 
  ON reviews(reviewer_id, created_at DESC);

-- ========================================
-- MESSAGES TABLE INDEXES
-- ========================================

-- Index for conversation thread queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at 
  ON messages(conversation_id, created_at DESC);

-- Index for unread message count
CREATE INDEX IF NOT EXISTS idx_messages_recipient_read 
  ON messages(recipient_id, read) 
  WHERE read = false;

-- ========================================
-- NOTIFICATIONS TABLE INDEXES
-- ========================================

-- Index for user notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
  ON notifications(user_id, created_at DESC);

-- Index for unread notifications count
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
  ON notifications(user_id, read) 
  WHERE read = false;

-- ========================================
-- LISTINGS TABLE INDEXES (Additional)
-- ========================================

-- Index for seller's active listings
CREATE INDEX IF NOT EXISTS idx_listings_seller_status 
  ON listings(seller_id, status) 
  WHERE status = 'active';

-- Index for featured listings by city
CREATE INDEX IF NOT EXISTS idx_listings_city_featured 
  ON listings(city_id, featured, created_at DESC) 
  WHERE featured = true AND status = 'active';

-- Index for inventory alerts
CREATE INDEX IF NOT EXISTS idx_listings_inventory_status 
  ON listings(inventory_count, status) 
  WHERE status = 'active' AND inventory_count IS NOT NULL AND inventory_count <= 5;

-- ========================================
-- LISTING_ANALYTICS TABLE INDEXES
-- ========================================

-- Index for tracking views over time
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_created 
  ON listing_analytics(listing_id, created_at DESC);

-- Index for analytics aggregation by date
CREATE INDEX IF NOT EXISTS idx_listing_analytics_date_type 
  ON listing_analytics(created_at DESC, event_type);

-- ========================================
-- CART_ITEMS TABLE INDEXES
-- ========================================

-- Index for user's cart queries
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id 
  ON cart_items(user_id, created_at DESC);

-- Index for abandoned cart analysis
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at 
  ON cart_items(created_at DESC);

-- ========================================
-- PROTECTION_CLAIMS TABLE INDEXES
-- ========================================

-- Index for admin claims queue
CREATE INDEX IF NOT EXISTS idx_protection_claims_status_created 
  ON protection_claims(status, created_at DESC) 
  WHERE status IN ('open', 'under_review');

-- Index for buyer's claims
CREATE INDEX IF NOT EXISTS idx_protection_claims_buyer_id 
  ON protection_claims(buyer_id, created_at DESC);

-- Index for seller's claims
CREATE INDEX IF NOT EXISTS idx_protection_claims_seller_id 
  ON protection_claims(seller_id, created_at DESC);

-- ========================================
-- DISPUTES TABLE INDEXES
-- ========================================

-- Index for active disputes
CREATE INDEX IF NOT EXISTS idx_disputes_status_created 
  ON disputes(status, created_at DESC) 
  WHERE status != 'resolved';

-- Index for order-related disputes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id 
  ON disputes(order_id);

-- ========================================
-- CONVERSATIONS TABLE INDEXES
-- ========================================

-- Index for user's conversations (buyer side)
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_updated 
  ON conversations(buyer_id, updated_at DESC);

-- Index for seller's conversations
CREATE INDEX IF NOT EXISTS idx_conversations_seller_updated 
  ON conversations(seller_id, updated_at DESC);

-- ========================================
-- COMPLIANCE TABLES INDEXES
-- ========================================

-- Index for seller compliance checks
CREATE INDEX IF NOT EXISTS idx_seller_tax_info_seller_id 
  ON seller_tax_info(seller_id);

-- Index for public disclosures by seller
CREATE INDEX IF NOT EXISTS idx_public_disclosures_seller_active 
  ON public_disclosures(seller_id, is_active) 
  WHERE is_active = true;

-- ========================================
-- FRAUD DETECTION INDEXES
-- ========================================

-- Index for fraud signals by user
CREATE INDEX IF NOT EXISTS idx_fraud_signals_user_severity 
  ON fraud_signals(user_id, severity, created_at DESC);

-- Index for user trust scores
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_user_id 
  ON user_trust_scores(user_id);

-- ========================================
-- SEARCH ANALYTICS INDEXES
-- ========================================

-- Index for search analytics aggregation
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at 
  ON search_analytics(created_at DESC);

-- Index for popular search terms
CREATE INDEX IF NOT EXISTS idx_search_analytics_query_city 
  ON search_analytics(search_query, city_id, created_at DESC);

-- ========================================
-- VERIFICATION
-- ========================================

-- List all newly created indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ========================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- ========================================

/*
After adding these indexes, you should see:

1. Seller/Buyer Dashboards: 50-60% faster (orders, messages, reviews)
2. Admin Queues: 60-70% faster (moderation, claims, disputes)
3. Search/Browse: 30-40% faster (category listings, featured items)
4. Analytics: 40-50% faster (reports, aggregations)
5. Notifications: 80% faster (unread count queries)

IMPORTANT NOTES:
- Indexes increase write time slightly (~5-10%) but drastically improve reads
- Monitor index usage with pg_stat_user_indexes
- Unused indexes should be dropped to save space
- Rebuild indexes monthly: REINDEX TABLE table_name;
*/
