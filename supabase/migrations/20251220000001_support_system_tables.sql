-- Support System Tables Migration
-- Created: 2025-12-20
-- Purpose: Create support tickets, messages, canned responses, and knowledge base tables

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  related_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  related_dispute_id uuid REFERENCES disputes(id) ON DELETE SET NULL,
  related_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,

  -- Ticket Details
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('billing', 'order_issue', 'account', 'technical', 'compliance', 'other')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),

  -- SLA Tracking
  sla_deadline timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,

  -- Metadata
  tags text[],
  internal_notes text,
  user_satisfaction_rating integer CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
  user_satisfaction_comment text,

  -- Auto-creation tracking
  auto_created boolean DEFAULT false,
  auto_created_from text CHECK (auto_created_from IN ('dispute', 'protection_claim', 'fraud_signal', 'user_submitted')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON support_tickets(sla_deadline) WHERE status NOT IN ('resolved', 'closed');

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count integer;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM support_tickets
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.ticket_number := 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::text, 4, '0');

  -- Set SLA deadline based on priority
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := NEW.created_at + CASE NEW.priority
      WHEN 'critical' THEN INTERVAL '2 hours'
      WHEN 'high' THEN INTERVAL '8 hours'
      WHEN 'normal' THEN INTERVAL '24 hours'
      WHEN 'low' THEN INTERVAL '48 hours'
      ELSE INTERVAL '24 hours'
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Update timestamp trigger
CREATE TRIGGER trigger_support_tickets_updated
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
ON support_tickets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

CREATE POLICY "Admins can manage all tickets"
ON support_tickets FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

-- ============================================================================
-- SUPPORT MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'user', 'system')),
  is_internal boolean DEFAULT false, -- Internal notes visible only to admins
  attachment_urls text[],
  read_by_user boolean DEFAULT false,
  read_by_admin boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread_user ON support_messages(ticket_id) WHERE read_by_user = false;
CREATE INDEX IF NOT EXISTS idx_support_messages_unread_admin ON support_messages(ticket_id) WHERE read_by_admin = false;

-- RLS Policies
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their tickets"
ON support_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_id
    AND support_tickets.user_id = auth.uid()
  )
  AND (is_internal = false OR sender_id = auth.uid())
);

CREATE POLICY "Users can send messages to their tickets"
ON support_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all messages"
ON support_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

CREATE POLICY "Admins can manage all messages"
ON support_messages FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

-- ============================================================================
-- CANNED RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('billing', 'order_issue', 'account', 'technical', 'compliance', 'other')),
  shortcode text UNIQUE, -- e.g., "/refund" for quick insertion
  variables text[], -- List of supported variables like {{user_name}}
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON support_canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcode ON support_canned_responses(shortcode) WHERE shortcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_canned_responses_active ON support_canned_responses(is_active);

-- RLS Policies
ALTER TABLE support_canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view canned responses"
ON support_canned_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

CREATE POLICY "Admins can manage canned responses"
ON support_canned_responses FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

-- ============================================================================
-- KNOWLEDGE BASE ARTICLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text NOT NULL,
  keywords text[],
  related_article_ids uuid[],
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  last_updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON kb_articles(is_published, category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON kb_articles(is_featured) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON kb_articles USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- RLS Policies
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published KB articles"
ON kb_articles FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can view all KB articles"
ON kb_articles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

CREATE POLICY "Admins can manage KB articles"
ON kb_articles FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

-- ============================================================================
-- TICKET ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN (
    'created', 'assigned', 'status_changed', 'priority_changed',
    'message_sent', 'resolved', 'reopened', 'closed'
  )),
  old_value text,
  new_value text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket ON ticket_activities(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_actor ON ticket_activities(actor_id);

-- RLS Policies
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their tickets"
ON ticket_activities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM support_tickets
  WHERE support_tickets.id = ticket_id
  AND support_tickets.user_id = auth.uid()
));

CREATE POLICY "Admins can view all activities"
ON ticket_activities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

-- Auto-create activity on ticket changes
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ticket_activities (ticket_id, actor_id, activity_type, description)
    VALUES (NEW.id, NEW.user_id, 'created', 'Ticket created');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO ticket_activities (ticket_id, actor_id, activity_type, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);

      IF NEW.status = 'resolved' THEN
        NEW.resolved_at := now();
      ELSIF NEW.status = 'closed' THEN
        NEW.closed_at := now();
      END IF;
    END IF;

    IF OLD.priority != NEW.priority THEN
      INSERT INTO ticket_activities (ticket_id, actor_id, activity_type, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority, NEW.priority, 'Priority changed from ' || OLD.priority || ' to ' || NEW.priority);
    END IF;

    IF OLD.assigned_admin_id IS DISTINCT FROM NEW.assigned_admin_id THEN
      INSERT INTO ticket_activities (ticket_id, actor_id, activity_type, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'assigned', OLD.assigned_admin_id::text, NEW.assigned_admin_id::text, 'Ticket assigned');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_ticket_activity
AFTER INSERT OR UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_activity();

-- Log first response time
CREATE OR REPLACE FUNCTION update_first_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type = 'admin' THEN
    UPDATE support_tickets
    SET first_response_at = COALESCE(first_response_at, now())
    WHERE id = NEW.ticket_id
    AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_first_response
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_first_response();

-- ============================================================================
-- SUPPORT METRICS (Daily Aggregates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  tickets_created integer DEFAULT 0,
  tickets_resolved integer DEFAULT 0,
  tickets_closed integer DEFAULT 0,
  avg_first_response_minutes numeric,
  avg_resolution_minutes numeric,
  sla_met_count integer DEFAULT 0,
  sla_breached_count integer DEFAULT 0,
  tickets_by_category jsonb DEFAULT '{}',
  tickets_by_priority jsonb DEFAULT '{}',
  avg_satisfaction_rating numeric,
  satisfaction_responses integer DEFAULT 0,
  tickets_by_admin jsonb DEFAULT '{}',
  calculated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_metrics_date ON support_metrics_daily(date DESC);

-- RLS Policies
ALTER TABLE support_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view support metrics"
ON support_metrics_daily FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
  AND user_roles.is_active = true
));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get ticket statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_support_stats()
RETURNS TABLE (
  total_open integer,
  total_in_progress integer,
  total_waiting integer,
  sla_approaching integer,
  tickets_today integer,
  resolved_today integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::integer FROM support_tickets WHERE status = 'open'),
    (SELECT COUNT(*)::integer FROM support_tickets WHERE status = 'in_progress'),
    (SELECT COUNT(*)::integer FROM support_tickets WHERE status = 'waiting_on_user'),
    (SELECT COUNT(*)::integer FROM support_tickets
     WHERE status NOT IN ('resolved', 'closed')
     AND sla_deadline IS NOT NULL
     AND sla_deadline <= now() + INTERVAL '2 hours'),
    (SELECT COUNT(*)::integer FROM support_tickets WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*)::integer FROM support_tickets WHERE DATE(resolved_at) = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_support_stats TO authenticated;

-- Get unread message count for a ticket
CREATE OR REPLACE FUNCTION get_ticket_unread_count(p_ticket_id uuid, p_for_user boolean DEFAULT true)
RETURNS integer AS $$
BEGIN
  IF p_for_user THEN
    RETURN (
      SELECT COUNT(*)::integer
      FROM support_messages
      WHERE ticket_id = p_ticket_id
      AND read_by_user = false
      AND sender_type != 'user'
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::integer
      FROM support_messages
      WHERE ticket_id = p_ticket_id
      AND read_by_admin = false
      AND sender_type = 'user'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_ticket_unread_count TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Support system tables created successfully!';
  RAISE NOTICE 'Tables: support_tickets, support_messages, support_canned_responses, kb_articles, ticket_activities, support_metrics_daily';
END $$;
