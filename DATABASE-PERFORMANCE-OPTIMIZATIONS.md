# Database Performance Optimizations

**Date:** January 2025  
**Status:** ✅ Completed

## Overview
Added comprehensive database indexes to improve query performance across the application, particularly for high-traffic pages like Browse, Orders, and messaging.

---

## 🎯 Indexes Added

### Listings Table (Most Critical)
```sql
-- City + Status filtering (Browse page)
idx_listings_city_id_status (city_id, status) WHERE status = 'active'

-- Category filtering
idx_listings_category_id_status (category_id, status) WHERE status = 'active'

-- Seller dashboard
idx_listings_seller_id_status (seller_id, status)

-- Featured products
idx_listings_featured_status (featured, status) WHERE featured = true

-- Ready Today filtering
idx_listings_ready_today (ready_today, status) WHERE ready_today = true

-- Price sorting
idx_listings_price (price) WHERE status = 'active'

-- Newest listings
idx_listings_created_at (created_at DESC)

-- Full-text search
idx_listings_search USING GIN(to_tsvector('english', title || description))
```

### Orders Table
```sql
-- Buyer order history
idx_orders_buyer_id_status (buyer_id, status)

-- Seller order management
idx_orders_seller_id_status (seller_id, status)

-- Recent orders
idx_orders_created_at (created_at DESC)

-- Status filtering
idx_orders_status (status)
```

### Profiles Table
```sql
-- City-based seller discovery
idx_profiles_city_id (city_id)

-- Seller filtering
idx_profiles_is_seller (is_seller) WHERE is_seller = true

-- Verified sellers
idx_profiles_seller_verified (seller_verified) WHERE seller_verified = true
```

### Reviews Table
```sql
-- Order-specific reviews
idx_reviews_order_id (order_id)

-- User review history
idx_reviews_reviewer_id (reviewer_id)

-- Seller ratings
idx_reviews_reviewed_user_id_rating (reviewed_user_id, rating)

-- Recent reviews
idx_reviews_created_at (created_at DESC)
```

### Messages Table
```sql
-- Conversation threads
idx_messages_conversation_id_created (conversation_id, created_at DESC)

-- Sender inbox
idx_messages_sender_id (sender_id)

-- Receiver inbox
idx_messages_receiver_id (receiver_id)

-- Listing inquiries
idx_messages_listing_id (listing_id)
```

### Notifications Table
```sql
-- User notifications with unread filter
idx_notifications_user_id_read (user_id, read, created_at DESC)

-- Recent notifications
idx_notifications_created_at (created_at DESC)
```

### Categories Table
```sql
-- City-specific categories
idx_categories_city_id_slug (city_id, slug)

-- Subcategories
idx_categories_parent_id (parent_id) WHERE parent_id IS NOT NULL
```

### Analytics Tables
```sql
-- Listing analytics
idx_listing_analytics_listing_date (listing_id, created_at DESC)
idx_listing_analytics_event_type (event_type)

-- Search analytics
idx_search_analytics_created_at (created_at DESC)
idx_search_analytics_user_id (user_id)
```

### Moderation Queue
```sql
-- Pending items
idx_moderation_queue_status (status, created_at DESC)
```

---

## 📊 Expected Performance Improvements

### Browse Page
**Before:** Full table scan on listings (slow with 1000+ items)  
**After:** Index scan on city_id + status (10-50x faster)

**Query:**
```sql
SELECT * FROM listings 
WHERE city_id = ? AND status = 'active' 
ORDER BY created_at DESC
```
**Impact:** Sub-100ms response even with 10,000+ listings

---

### Seller Dashboard
**Before:** Sequential scan filtering by seller_id  
**After:** Direct index lookup

**Query:**
```sql
SELECT * FROM listings 
WHERE seller_id = ? AND status = 'active'
```
**Impact:** Instant load for seller's listings

---

### Order History
**Before:** Full scan of orders table  
**After:** Composite index on buyer_id + status

**Query:**
```sql
SELECT * FROM orders 
WHERE buyer_id = ? 
ORDER BY created_at DESC
```
**Impact:** 20-100x faster for users with many orders

---

### Search Functionality
**Before:** LIKE query with sequential scan (very slow)  
**After:** GIN index with full-text search

**Query:**
```sql
SELECT * FROM listings 
WHERE to_tsvector('english', title || description) 
  @@ to_tsquery('english', ?)
```
**Impact:** 100-1000x faster for text search

---

### Message Threading
**Before:** Sort all messages by conversation  
**After:** Composite index pre-sorted

**Query:**
```sql
SELECT * FROM messages 
WHERE conversation_id = ? 
ORDER BY created_at DESC
```
**Impact:** Instant message loading

---

## 🔍 Index Types Used

### B-Tree Indexes (Default)
Used for: Equality, range queries, sorting
- Most common type
- Best for columns with high cardinality
- Efficient for ORDER BY operations

### GIN Indexes (Full-Text Search)
Used for: Text search, array operations
- idx_listings_search for product search
- Enables fast natural language queries
- Supports @@ (text search) operator

### Partial Indexes (WHERE clause)
Used for: Filtered queries
- Only indexes rows matching condition
- Smaller index size
- Faster for specific queries
- Examples: WHERE status = 'active', WHERE is_seller = true

---

## 🎯 Query Optimization Best Practices

### 1. Use Index-Friendly Queries
```sql
-- ✅ GOOD - Uses index
SELECT * FROM listings WHERE city_id = '...' AND status = 'active'

-- ❌ BAD - Function prevents index use
SELECT * FROM listings WHERE LOWER(status) = 'active'
```

### 2. Avoid SELECT *
```sql
-- ✅ GOOD - Only fetch needed columns
SELECT id, title, price FROM listings

-- ❌ BAD - Fetches unnecessary data
SELECT * FROM listings
```

### 3. Use Pagination
```sql
-- ✅ GOOD - LIMIT with OFFSET
SELECT * FROM listings ORDER BY created_at DESC LIMIT 20 OFFSET 0

-- ❌ BAD - Fetch all rows
SELECT * FROM listings ORDER BY created_at DESC
```

### 4. Leverage Composite Indexes
```sql
-- ✅ GOOD - Uses (buyer_id, status) index
SELECT * FROM orders WHERE buyer_id = ? AND status = 'pending'

-- ⚠️ PARTIAL - Only uses buyer_id part
SELECT * FROM orders WHERE buyer_id = ?

-- ❌ BAD - Cannot use index efficiently
SELECT * FROM orders WHERE status = 'pending'
```

---

## 📈 Monitoring Performance

### Check Index Usage
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Find Slow Queries
```sql
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Check Missing Indexes
```sql
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY correlation ASC;
```

---

## 🚀 Next Steps

### Immediate
- [x] Add core performance indexes
- [ ] Test query performance on production data
- [ ] Monitor index usage with pg_stat

### Short-term (1-2 weeks)
- [ ] Add EXPLAIN ANALYZE to slow queries
- [ ] Implement query result caching for Browse page
- [ ] Add materialized views for analytics

### Long-term (1-3 months)
- [ ] Implement database connection pooling
- [ ] Add read replicas for analytics queries
- [ ] Set up automated VACUUM and ANALYZE schedules
- [ ] Implement partition strategy for large tables (orders, messages)

---

## 💡 Key Learnings

### 1. Partial Indexes Save Space
- Indexes with WHERE clauses are smaller and faster
- Example: Only indexing `status = 'active'` listings

### 2. Composite Index Order Matters
- Index (city_id, status) ≠ Index (status, city_id)
- Order should match query WHERE clause order

### 3. Full-Text Search is Powerful
- GIN indexes enable natural language search
- Much faster than LIKE '%keyword%' queries
- Supports stemming and language-specific rules

### 4. Indexes Have Trade-offs
- Faster reads, slower writes
- Disk space usage
- Maintenance overhead (VACUUM needed)

---

## 📚 Resources

- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Supabase Performance Tips](https://supabase.com/docs/guides/database/performance)
- [Index Best Practices](https://wiki.postgresql.org/wiki/Index_Maintenance)

---

## ✅ Summary

All critical database indexes have been added to optimize:
- Browse page city/category filtering
- Seller dashboard queries
- Order history retrieval
- Full-text product search
- Message threading
- Notification fetching

**Expected Performance Gain:** 10-1000x faster queries depending on table size and query type.
