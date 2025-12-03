-- Comprehensive Row Level Security Policies Migration
-- This migration enables RLS on all tables and creates appropriate policies
-- Based on data access patterns: public, user-owned, seller-owned, admin-only, transactional

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if user is seller
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_seller = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 1: PUBLIC READ TABLES (Anyone can read, admins can manage)
-- Tables: categories, cities, plans, featured_makers, featured_slots, blog_articles,
--         blog_keywords, blog_keyword_clusters, blog_post_templates, blog_content_calendar,
--         blog_seo_keywords, craft_courses, mentorship_programs, pickup_meetups,
--         maker_livestreams, collections (public ones)
-- ============================================================================

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are publicly viewable" ON public.categories;
CREATE POLICY "Categories are publicly viewable" ON public.categories
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Cities
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cities are publicly viewable" ON public.cities;
CREATE POLICY "Cities are publicly viewable" ON public.cities
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;
CREATE POLICY "Admins can manage cities" ON public.cities
  FOR ALL USING (public.is_admin());

-- Featured makers (public showcase)
ALTER TABLE public.featured_makers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Featured makers are publicly viewable" ON public.featured_makers;
CREATE POLICY "Featured makers are publicly viewable" ON public.featured_makers
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage featured makers" ON public.featured_makers;
CREATE POLICY "Admins can manage featured makers" ON public.featured_makers
  FOR ALL USING (public.is_admin());

-- Featured slots
ALTER TABLE public.featured_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Featured slots are publicly viewable" ON public.featured_slots;
CREATE POLICY "Featured slots are publicly viewable" ON public.featured_slots
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage featured slots" ON public.featured_slots;
CREATE POLICY "Admins can manage featured slots" ON public.featured_slots
  FOR ALL USING (public.is_admin());

-- Blog articles (published ones are public)
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published blog articles are publicly viewable" ON public.blog_articles;
CREATE POLICY "Published blog articles are publicly viewable" ON public.blog_articles
  FOR SELECT USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage blog articles" ON public.blog_articles;
CREATE POLICY "Admins can manage blog articles" ON public.blog_articles
  FOR ALL USING (public.is_admin());

-- Blog analytics
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view blog analytics" ON public.blog_analytics;
CREATE POLICY "Admins can view blog analytics" ON public.blog_analytics
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage blog analytics" ON public.blog_analytics;
CREATE POLICY "System can manage blog analytics" ON public.blog_analytics
  FOR ALL USING (true);

-- Blog article products
ALTER TABLE public.blog_article_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Blog article products are publicly viewable" ON public.blog_article_products;
CREATE POLICY "Blog article products are publicly viewable" ON public.blog_article_products
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage blog article products" ON public.blog_article_products;
CREATE POLICY "Admins can manage blog article products" ON public.blog_article_products
  FOR ALL USING (public.is_admin());

-- Blog article templates
ALTER TABLE public.blog_article_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can access blog templates" ON public.blog_article_templates;
CREATE POLICY "Admins can access blog templates" ON public.blog_article_templates
  FOR ALL USING (public.is_admin());

-- Blog keyword clusters
ALTER TABLE public.blog_keyword_clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Blog keyword clusters are publicly viewable" ON public.blog_keyword_clusters;
CREATE POLICY "Blog keyword clusters are publicly viewable" ON public.blog_keyword_clusters
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage blog keyword clusters" ON public.blog_keyword_clusters;
CREATE POLICY "Admins can manage blog keyword clusters" ON public.blog_keyword_clusters
  FOR ALL USING (public.is_admin());

-- Blog keywords
ALTER TABLE public.blog_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Blog keywords are publicly viewable" ON public.blog_keywords;
CREATE POLICY "Blog keywords are publicly viewable" ON public.blog_keywords
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage blog keywords" ON public.blog_keywords;
CREATE POLICY "Admins can manage blog keywords" ON public.blog_keywords
  FOR ALL USING (public.is_admin());

-- Blog post templates
ALTER TABLE public.blog_post_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can access blog post templates" ON public.blog_post_templates;
CREATE POLICY "Admins can access blog post templates" ON public.blog_post_templates
  FOR ALL USING (public.is_admin());

-- Blog content calendar
ALTER TABLE public.blog_content_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can access blog content calendar" ON public.blog_content_calendar;
CREATE POLICY "Admins can access blog content calendar" ON public.blog_content_calendar
  FOR ALL USING (public.is_admin());

-- Blog SEO keywords
ALTER TABLE public.blog_seo_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Blog SEO keywords are publicly viewable" ON public.blog_seo_keywords;
CREATE POLICY "Blog SEO keywords are publicly viewable" ON public.blog_seo_keywords
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage blog SEO keywords" ON public.blog_seo_keywords;
CREATE POLICY "Admins can manage blog SEO keywords" ON public.blog_seo_keywords
  FOR ALL USING (public.is_admin());

-- Craft courses (published ones are public)
ALTER TABLE public.craft_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published courses are publicly viewable" ON public.craft_courses;
CREATE POLICY "Published courses are publicly viewable" ON public.craft_courses
  FOR SELECT USING (is_published = true OR instructor_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Instructors can manage their courses" ON public.craft_courses;
CREATE POLICY "Instructors can manage their courses" ON public.craft_courses
  FOR ALL USING (instructor_id = auth.uid() OR public.is_admin());

-- Mentorship programs (accepting ones are public)
ALTER TABLE public.mentorship_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mentorship programs are publicly viewable" ON public.mentorship_programs;
CREATE POLICY "Mentorship programs are publicly viewable" ON public.mentorship_programs
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mentors can manage their programs" ON public.mentorship_programs;
CREATE POLICY "Mentors can manage their programs" ON public.mentorship_programs
  FOR ALL USING (mentor_id = auth.uid() OR public.is_admin());

-- Pickup meetups (active ones are public)
ALTER TABLE public.pickup_meetups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active meetups are publicly viewable" ON public.pickup_meetups;
CREATE POLICY "Active meetups are publicly viewable" ON public.pickup_meetups
  FOR SELECT USING (is_active = true OR seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Sellers can manage their meetups" ON public.pickup_meetups;
CREATE POLICY "Sellers can manage their meetups" ON public.pickup_meetups
  FOR ALL USING (seller_id = auth.uid() OR public.is_admin());

-- Maker livestreams
ALTER TABLE public.maker_livestreams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Livestreams are publicly viewable" ON public.maker_livestreams;
CREATE POLICY "Livestreams are publicly viewable" ON public.maker_livestreams
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Makers can manage their livestreams" ON public.maker_livestreams;
CREATE POLICY "Makers can manage their livestreams" ON public.maker_livestreams
  FOR ALL USING (maker_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- SECTION 2: USER-OWNED DATA (Users can only access their own data)
-- Tables: profiles, carts, listing_favorites, course_enrollments, mentorship_applications,
--         meetup_attendees, collection_follows, analytics_trends (user-specific)
-- ============================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable" ON public.profiles
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Carts
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
CREATE POLICY "Users can view their own cart" ON public.carts
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
CREATE POLICY "Users can manage their own cart" ON public.carts
  FOR ALL USING (user_id = auth.uid());

-- Listing favorites
ALTER TABLE public.listing_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.listing_favorites;
CREATE POLICY "Users can view their own favorites" ON public.listing_favorites
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.listing_favorites;
CREATE POLICY "Users can manage their own favorites" ON public.listing_favorites
  FOR ALL USING (user_id = auth.uid());

-- Course enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can manage their own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can manage their own enrollments" ON public.course_enrollments
  FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.course_enrollments;
CREATE POLICY "Instructors can view course enrollments" ON public.course_enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.craft_courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- Mentorship applications
ALTER TABLE public.mentorship_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.mentorship_applications;
CREATE POLICY "Users can view their own applications" ON public.mentorship_applications
  FOR SELECT USING (applicant_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can create applications" ON public.mentorship_applications;
CREATE POLICY "Users can create applications" ON public.mentorship_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());
DROP POLICY IF EXISTS "Mentors can view and manage applications to their programs" ON public.mentorship_applications;
CREATE POLICY "Mentors can view and manage applications to their programs" ON public.mentorship_applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.mentorship_programs WHERE id = program_id AND mentor_id = auth.uid())
  );

-- Meetup attendees
ALTER TABLE public.meetup_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view meetup attendees" ON public.meetup_attendees;
CREATE POLICY "Users can view meetup attendees" ON public.meetup_attendees
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own attendance" ON public.meetup_attendees;
CREATE POLICY "Users can manage their own attendance" ON public.meetup_attendees
  FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Meetup hosts can manage attendees" ON public.meetup_attendees;
CREATE POLICY "Meetup hosts can manage attendees" ON public.meetup_attendees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pickup_meetups WHERE id = meetup_id AND seller_id = auth.uid())
  );

-- Collection follows
ALTER TABLE public.collection_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view collection follows" ON public.collection_follows;
CREATE POLICY "Users can view collection follows" ON public.collection_follows
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.collection_follows;
CREATE POLICY "Users can manage their own follows" ON public.collection_follows
  FOR ALL USING (user_id = auth.uid());

-- Analytics trends (admin only for viewing)
ALTER TABLE public.analytics_trends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view analytics trends" ON public.analytics_trends;
CREATE POLICY "Admins can view analytics trends" ON public.analytics_trends
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage analytics trends" ON public.analytics_trends;
CREATE POLICY "System can manage analytics trends" ON public.analytics_trends
  FOR ALL USING (true);

-- ============================================================================
-- SECTION 3: LISTINGS & SELLER-OWNED DATA
-- Tables: listings, listing_analytics, moderation_logs, shipping_zones, inventory_alerts
-- ============================================================================

-- Listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active listings are publicly viewable" ON public.listings;
CREATE POLICY "Active listings are publicly viewable" ON public.listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Sellers can manage their own listings" ON public.listings;
CREATE POLICY "Sellers can manage their own listings" ON public.listings
  FOR ALL USING (seller_id = auth.uid() OR public.is_admin());

-- Listing analytics
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can view their listing analytics" ON public.listing_analytics;
CREATE POLICY "Sellers can view their listing analytics" ON public.listing_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "System can insert listing analytics" ON public.listing_analytics;
CREATE POLICY "System can insert listing analytics" ON public.listing_analytics
  FOR INSERT WITH CHECK (true);

-- Moderation logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can view moderation logs" ON public.moderation_logs
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Moderators can create moderation logs" ON public.moderation_logs;
CREATE POLICY "Moderators can create moderation logs" ON public.moderation_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- Moderation queue
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view moderation queue" ON public.moderation_queue;
CREATE POLICY "Admins can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage moderation queue" ON public.moderation_queue;
CREATE POLICY "Admins can manage moderation queue" ON public.moderation_queue
  FOR ALL USING (public.is_admin());

-- Shipping zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipping zones are publicly viewable" ON public.shipping_zones;
CREATE POLICY "Shipping zones are publicly viewable" ON public.shipping_zones
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones
  FOR ALL USING (public.is_admin());

-- Inventory alerts
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can view their inventory alerts" ON public.inventory_alerts;
CREATE POLICY "Sellers can view their inventory alerts" ON public.inventory_alerts
  FOR SELECT USING (seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Sellers can manage their inventory alerts" ON public.inventory_alerts;
CREATE POLICY "Sellers can manage their inventory alerts" ON public.inventory_alerts
  FOR ALL USING (seller_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- SECTION 4: TRANSACTIONAL DATA (Buyer and seller can access their orders)
-- Tables: orders, order_items, order_reminders, commission_payouts
-- ============================================================================

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Buyers can view their orders" ON public.orders;
CREATE POLICY "Buyers can view their orders" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());
DROP POLICY IF EXISTS "Order participants can update orders" ON public.orders;
CREATE POLICY "Order participants can update orders" ON public.orders
  FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- Order reminders
ALTER TABLE public.order_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their order reminders" ON public.order_reminders;
CREATE POLICY "Users can view their order reminders" ON public.order_reminders
  FOR SELECT USING (recipient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "System can manage order reminders" ON public.order_reminders;
CREATE POLICY "System can manage order reminders" ON public.order_reminders
  FOR ALL USING (true);

-- Commission payouts
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can view their commission payouts" ON public.commission_payouts;
CREATE POLICY "Sellers can view their commission payouts" ON public.commission_payouts
  FOR SELECT USING (seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage commission payouts" ON public.commission_payouts;
CREATE POLICY "Admins can manage commission payouts" ON public.commission_payouts
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- SECTION 5: MESSAGING & COMMUNICATION
-- Tables: messages, support_tickets, support_messages, support_ticket_activity
-- ============================================================================

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
CREATE POLICY "Users can update their messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their support tickets" ON public.support_tickets;
CREATE POLICY "Users can view their support tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
CREATE POLICY "Users can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage support tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin());

-- Support messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view support messages for their tickets" ON public.support_messages;
CREATE POLICY "Users can view support messages for their tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR assigned_to = auth.uid()))
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Users can send support messages" ON public.support_messages;
CREATE POLICY "Users can send support messages" ON public.support_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Support ticket activity
ALTER TABLE public.support_ticket_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view activity for their tickets" ON public.support_ticket_activity;
CREATE POLICY "Users can view activity for their tickets" ON public.support_ticket_activity
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR assigned_to = auth.uid()))
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "System can manage ticket activity" ON public.support_ticket_activity;
CREATE POLICY "System can manage ticket activity" ON public.support_ticket_activity
  FOR ALL USING (true);

-- Support canned responses
ALTER TABLE public.support_canned_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage canned responses" ON public.support_canned_responses;
CREATE POLICY "Admins can manage canned responses" ON public.support_canned_responses
  FOR ALL USING (public.is_admin());

-- Support KB articles
ALTER TABLE public.support_kb_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published KB articles are publicly viewable" ON public.support_kb_articles;
CREATE POLICY "Published KB articles are publicly viewable" ON public.support_kb_articles
  FOR SELECT USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage KB articles" ON public.support_kb_articles;
CREATE POLICY "Admins can manage KB articles" ON public.support_kb_articles
  FOR ALL USING (public.is_admin());

-- Support metrics daily
ALTER TABLE public.support_metrics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view support metrics" ON public.support_metrics_daily;
CREATE POLICY "Admins can view support metrics" ON public.support_metrics_daily
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage support metrics" ON public.support_metrics_daily;
CREATE POLICY "System can manage support metrics" ON public.support_metrics_daily
  FOR ALL USING (true);

-- ============================================================================
-- SECTION 6: REVIEWS & RATINGS
-- Tables: reviews, review_responses
-- ============================================================================

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approved reviews are publicly viewable" ON public.reviews;
CREATE POLICY "Approved reviews are publicly viewable" ON public.reviews
  FOR SELECT USING (status = 'approved' OR reviewer_id = auth.uid() OR reviewed_user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (reviewer_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- Review responses
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review responses are publicly viewable" ON public.review_responses;
CREATE POLICY "Review responses are publicly viewable" ON public.review_responses
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers can respond to reviews" ON public.review_responses;
CREATE POLICY "Sellers can respond to reviews" ON public.review_responses
  FOR INSERT WITH CHECK (seller_id = auth.uid());
DROP POLICY IF EXISTS "Sellers can update their responses" ON public.review_responses;
CREATE POLICY "Sellers can update their responses" ON public.review_responses
  FOR UPDATE USING (seller_id = auth.uid());

-- ============================================================================
-- SECTION 7: COLLECTIONS
-- Tables: collections, collection_items
-- ============================================================================

-- Collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public collections are viewable" ON public.collections;
CREATE POLICY "Public collections are viewable" ON public.collections
  FOR SELECT USING (is_public = true OR creator_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.collections;
CREATE POLICY "Users can manage their own collections" ON public.collections
  FOR ALL USING (creator_id = auth.uid() OR public.is_admin());

-- Collection items
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Collection items in public collections are viewable" ON public.collection_items;
CREATE POLICY "Collection items in public collections are viewable" ON public.collection_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND (is_public = true OR creator_id = auth.uid()))
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Users can manage items in their collections" ON public.collection_items;
CREATE POLICY "Users can manage items in their collections" ON public.collection_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND creator_id = auth.uid())
    OR public.is_admin()
  );

-- ============================================================================
-- SECTION 8: PROTECTION CLAIMS & DISPUTES
-- Tables: protection_claims, protection_claim_messages
-- ============================================================================

-- Protection claims
ALTER TABLE public.protection_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their protection claims" ON public.protection_claims;
CREATE POLICY "Users can view their protection claims" ON public.protection_claims
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Buyers can create protection claims" ON public.protection_claims;
CREATE POLICY "Buyers can create protection claims" ON public.protection_claims
  FOR INSERT WITH CHECK (buyer_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage protection claims" ON public.protection_claims;
CREATE POLICY "Admins can manage protection claims" ON public.protection_claims
  FOR ALL USING (public.is_admin());

-- Protection claim messages
ALTER TABLE public.protection_claim_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Claim participants can view messages" ON public.protection_claim_messages;
CREATE POLICY "Claim participants can view messages" ON public.protection_claim_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.protection_claims WHERE id = claim_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Claim participants can send messages" ON public.protection_claim_messages;
CREATE POLICY "Claim participants can send messages" ON public.protection_claim_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- SECTION 9: ADMIN-ONLY TABLES
-- Tables: admin_audit_log, user_roles, webhook_settings, webhook_logs, platform_fee_config,
--         platform_revenue, sales_tax_nexus, dmca_notices, compliance_audit_log,
--         campaign_automation, social_media_campaigns, social_media_posts, social_media_templates
-- ============================================================================

-- Admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can insert audit log" ON public.admin_audit_log;
CREATE POLICY "System can insert audit log" ON public.admin_audit_log
  FOR INSERT WITH CHECK (true);

-- User roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Webhook settings
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage webhook settings" ON public.webhook_settings;
CREATE POLICY "Admins can manage webhook settings" ON public.webhook_settings
  FOR ALL USING (public.is_admin());

-- Webhook logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage webhook logs" ON public.webhook_logs;
CREATE POLICY "System can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (true);

-- Platform fee config
ALTER TABLE public.platform_fee_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage platform fee config" ON public.platform_fee_config;
CREATE POLICY "Admins can manage platform fee config" ON public.platform_fee_config
  FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Platform fee config is viewable by sellers" ON public.platform_fee_config;
CREATE POLICY "Platform fee config is viewable by sellers" ON public.platform_fee_config
  FOR SELECT USING (public.is_seller() OR public.is_admin());

-- Platform revenue
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view platform revenue" ON public.platform_revenue;
CREATE POLICY "Admins can view platform revenue" ON public.platform_revenue
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage platform revenue" ON public.platform_revenue;
CREATE POLICY "System can manage platform revenue" ON public.platform_revenue
  FOR ALL USING (true);

-- Sales tax nexus
ALTER TABLE public.sales_tax_nexus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage sales tax nexus" ON public.sales_tax_nexus;
CREATE POLICY "Admins can manage sales tax nexus" ON public.sales_tax_nexus
  FOR ALL USING (public.is_admin());

-- DMCA notices
ALTER TABLE public.dmca_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage DMCA notices" ON public.dmca_notices;
CREATE POLICY "Admins can manage DMCA notices" ON public.dmca_notices
  FOR ALL USING (public.is_admin());

-- Compliance audit log
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view compliance audit log" ON public.compliance_audit_log;
CREATE POLICY "Admins can view compliance audit log" ON public.compliance_audit_log
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can insert compliance audit log" ON public.compliance_audit_log;
CREATE POLICY "System can insert compliance audit log" ON public.compliance_audit_log
  FOR INSERT WITH CHECK (true);

-- Campaign automation
ALTER TABLE public.campaign_automation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage campaign automation" ON public.campaign_automation;
CREATE POLICY "Admins can manage campaign automation" ON public.campaign_automation
  FOR ALL USING (public.is_admin() OR created_by = auth.uid());

-- Social media campaigns
ALTER TABLE public.social_media_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage social media campaigns" ON public.social_media_campaigns;
CREATE POLICY "Admins can manage social media campaigns" ON public.social_media_campaigns
  FOR ALL USING (public.is_admin());

-- Social media posts
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage social media posts" ON public.social_media_posts;
CREATE POLICY "Admins can manage social media posts" ON public.social_media_posts
  FOR ALL USING (public.is_admin());

-- Social media templates
ALTER TABLE public.social_media_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage social media templates" ON public.social_media_templates;
CREATE POLICY "Admins can manage social media templates" ON public.social_media_templates
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- SECTION 10: SELLER TAX & COMPLIANCE
-- Tables: seller_tax_info, seller_public_disclosures, seller_performance_metrics
-- ============================================================================

-- Seller tax info
ALTER TABLE public.seller_tax_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can view their own tax info" ON public.seller_tax_info;
CREATE POLICY "Sellers can view their own tax info" ON public.seller_tax_info
  FOR SELECT USING (seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Sellers can manage their own tax info" ON public.seller_tax_info;
CREATE POLICY "Sellers can manage their own tax info" ON public.seller_tax_info
  FOR ALL USING (seller_id = auth.uid() OR public.is_admin());

-- Seller public disclosures
ALTER TABLE public.seller_public_disclosures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public disclosures are viewable" ON public.seller_public_disclosures;
CREATE POLICY "Public disclosures are viewable" ON public.seller_public_disclosures
  FOR SELECT USING (is_active = true OR seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Sellers can manage their disclosures" ON public.seller_public_disclosures;
CREATE POLICY "Sellers can manage their disclosures" ON public.seller_public_disclosures
  FOR ALL USING (seller_id = auth.uid() OR public.is_admin());

-- Seller performance metrics (already has some policies, adding comprehensive ones)
ALTER TABLE public.seller_performance_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can view their own performance metrics" ON public.seller_performance_metrics;
CREATE POLICY "Sellers can view their own performance metrics" ON public.seller_performance_metrics
  FOR SELECT USING (seller_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "System can manage performance metrics" ON public.seller_performance_metrics;
CREATE POLICY "System can manage performance metrics" ON public.seller_performance_metrics
  FOR ALL USING (true);

-- ============================================================================
-- SECTION 11: AI TABLES
-- Tables: ai_models, ai_settings, ai_generation_logs
-- ============================================================================

-- AI models
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AI models are viewable" ON public.ai_models;
CREATE POLICY "AI models are viewable" ON public.ai_models
  FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage AI models" ON public.ai_models;
CREATE POLICY "Admins can manage AI models" ON public.ai_models
  FOR ALL USING (public.is_admin());

-- AI settings
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AI settings are viewable" ON public.ai_settings;
CREATE POLICY "AI settings are viewable" ON public.ai_settings
  FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage AI settings" ON public.ai_settings;
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings
  FOR ALL USING (public.is_admin());

-- AI generation logs
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own AI generation logs" ON public.ai_generation_logs;
CREATE POLICY "Users can view their own AI generation logs" ON public.ai_generation_logs
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can create AI generation logs" ON public.ai_generation_logs;
CREATE POLICY "Users can create AI generation logs" ON public.ai_generation_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SECTION 12: NEWSLETTER & USER ACTIVITY
-- Tables: newsletter_subscriptions, user_activity_log, rate_limit_logs
-- ============================================================================

-- Newsletter subscriptions
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can view newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can manage newsletter subscriptions" ON public.newsletter_subscriptions
  FOR ALL USING (public.is_admin());

-- User activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own activity log" ON public.user_activity_log;
CREATE POLICY "Users can view their own activity log" ON public.user_activity_log
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "System can manage activity log" ON public.user_activity_log;
CREATE POLICY "System can manage activity log" ON public.user_activity_log
  FOR ALL USING (true);

-- Rate limit logs
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "System can manage rate limit logs" ON public.rate_limit_logs
  FOR ALL USING (true);

-- ============================================================================
-- SECTION 13: SYSTEM METRICS & HEALTH
-- Tables: system_metrics
-- ============================================================================

-- System metrics
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view system metrics" ON public.system_metrics;
CREATE POLICY "Admins can view system metrics" ON public.system_metrics
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage metrics" ON public.system_metrics;
CREATE POLICY "System can manage metrics" ON public.system_metrics
  FOR ALL USING (true);

-- ============================================================================
-- SECTION 14: GSC (Google Search Console) TABLES
-- Tables: gsc_properties, gsc_oauth_credentials, gsc_keyword_performance, gsc_page_performance
-- ============================================================================

-- GSC properties
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage GSC properties" ON public.gsc_properties;
CREATE POLICY "Admins can manage GSC properties" ON public.gsc_properties
  FOR ALL USING (public.is_admin());

-- GSC OAuth credentials
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Users can view their own GSC credentials" ON public.gsc_oauth_credentials
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can manage their own GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Users can manage their own GSC credentials" ON public.gsc_oauth_credentials
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- GSC keyword performance
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view GSC keyword performance" ON public.gsc_keyword_performance;
CREATE POLICY "Admins can view GSC keyword performance" ON public.gsc_keyword_performance
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage GSC keyword performance" ON public.gsc_keyword_performance;
CREATE POLICY "System can manage GSC keyword performance" ON public.gsc_keyword_performance
  FOR ALL USING (true);

-- GSC page performance
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view GSC page performance" ON public.gsc_page_performance;
CREATE POLICY "Admins can view GSC page performance" ON public.gsc_page_performance
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can manage GSC page performance" ON public.gsc_page_performance;
CREATE POLICY "System can manage GSC page performance" ON public.gsc_page_performance
  FOR ALL USING (true);

-- ============================================================================
-- SECTION 15: ADDITIONAL SEO TABLES (if not already covered)
-- These tables may already have RLS from other migrations
-- ============================================================================

-- SEO audit schedules
DO $$ BEGIN
  ALTER TABLE public.seo_audit_schedules ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO audit schedules" ON public.seo_audit_schedules;
CREATE POLICY "Admins can manage SEO audit schedules" ON public.seo_audit_schedules
  FOR ALL USING (public.is_admin());

-- SEO autofix history
DO $$ BEGIN
  ALTER TABLE public.seo_autofix_history ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can view SEO autofix history" ON public.seo_autofix_history;
CREATE POLICY "Admins can view SEO autofix history" ON public.seo_autofix_history
  FOR SELECT USING (public.is_admin());

-- SEO autofix rules
DO $$ BEGIN
  ALTER TABLE public.seo_autofix_rules ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO autofix rules" ON public.seo_autofix_rules;
CREATE POLICY "Admins can manage SEO autofix rules" ON public.seo_autofix_rules
  FOR ALL USING (public.is_admin());

-- SEO automation logs
DO $$ BEGIN
  ALTER TABLE public.seo_automation_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can view SEO automation logs" ON public.seo_automation_logs;
CREATE POLICY "Admins can view SEO automation logs" ON public.seo_automation_logs
  FOR SELECT USING (public.is_admin());

-- SEO competitor tracking
DO $$ BEGIN
  ALTER TABLE public.seo_competitor_tracking ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO competitor tracking" ON public.seo_competitor_tracking;
CREATE POLICY "Admins can manage SEO competitor tracking" ON public.seo_competitor_tracking
  FOR ALL USING (public.is_admin());

-- SEO crawl results (if exists)
DO $$ BEGIN
  ALTER TABLE public.seo_crawl_results ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- SEO duplicate content
DO $$ BEGIN
  ALTER TABLE public.seo_duplicate_content ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO duplicate content" ON public.seo_duplicate_content;
CREATE POLICY "Admins can manage SEO duplicate content" ON public.seo_duplicate_content
  FOR ALL USING (public.is_admin());

-- SEO image analysis
DO $$ BEGIN
  ALTER TABLE public.seo_image_analysis ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO image analysis" ON public.seo_image_analysis;
CREATE POLICY "Admins can manage SEO image analysis" ON public.seo_image_analysis
  FOR ALL USING (public.is_admin());

-- SEO link analysis
DO $$ BEGIN
  ALTER TABLE public.seo_link_analysis ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO link analysis" ON public.seo_link_analysis;
CREATE POLICY "Admins can manage SEO link analysis" ON public.seo_link_analysis
  FOR ALL USING (public.is_admin());

-- SEO mobile analysis
DO $$ BEGIN
  ALTER TABLE public.seo_mobile_analysis ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO mobile analysis" ON public.seo_mobile_analysis;
CREATE POLICY "Admins can manage SEO mobile analysis" ON public.seo_mobile_analysis
  FOR ALL USING (public.is_admin());

-- SEO notification queue
DO $$ BEGIN
  ALTER TABLE public.seo_notification_queue ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO notification queue" ON public.seo_notification_queue;
CREATE POLICY "Admins can manage SEO notification queue" ON public.seo_notification_queue
  FOR ALL USING (public.is_admin());

-- SEO performance budget
DO $$ BEGIN
  ALTER TABLE public.seo_performance_budget ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO performance budget" ON public.seo_performance_budget;
CREATE POLICY "Admins can manage SEO performance budget" ON public.seo_performance_budget
  FOR ALL USING (public.is_admin());

-- SEO redirect analysis
DO $$ BEGIN
  ALTER TABLE public.seo_redirect_analysis ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO redirect analysis" ON public.seo_redirect_analysis;
CREATE POLICY "Admins can manage SEO redirect analysis" ON public.seo_redirect_analysis
  FOR ALL USING (public.is_admin());

-- SEO report history
DO $$ BEGIN
  ALTER TABLE public.seo_report_history ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO report history" ON public.seo_report_history;
CREATE POLICY "Admins can manage SEO report history" ON public.seo_report_history
  FOR ALL USING (public.is_admin());

-- SEO scheduled reports
DO $$ BEGIN
  ALTER TABLE public.seo_scheduled_reports ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO scheduled reports" ON public.seo_scheduled_reports;
CREATE POLICY "Admins can manage SEO scheduled reports" ON public.seo_scheduled_reports
  FOR ALL USING (public.is_admin());

-- SEO security analysis
DO $$ BEGIN
  ALTER TABLE public.seo_security_analysis ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO security analysis" ON public.seo_security_analysis;
CREATE POLICY "Admins can manage SEO security analysis" ON public.seo_security_analysis
  FOR ALL USING (public.is_admin());

-- SEO structured data
DO $$ BEGIN
  ALTER TABLE public.seo_structured_data ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "Admins can manage SEO structured data" ON public.seo_structured_data;
CREATE POLICY "Admins can manage SEO structured data" ON public.seo_structured_data
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_seller() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller() TO anon;

-- ============================================================================
-- COMMENT ON MIGRATION
-- ============================================================================
COMMENT ON FUNCTION public.is_admin() IS 'Helper function for RLS policies to check if current user is an admin';
COMMENT ON FUNCTION public.is_seller() IS 'Helper function for RLS policies to check if current user is a seller';
