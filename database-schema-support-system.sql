-- =====================================================
-- INTELLIGENT SUPPORT HUB - DATABASE SCHEMA
-- =====================================================
-- This schema supports the unified support ticketing system
-- for Craft Chicago Finds marketplace admin operations

-- =====================================================
-- 1. SUPPORT TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
  related_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,

  -- Ticket Details
  ticket_number TEXT UNIQUE NOT NULL, -- Format: TKT-YYYYMMDD-XXXX
  subject TEXT NOT NULL,
  category TEXT NOT NULL, -- 'billing', 'order_issue', 'account', 'technical', 'compliance', 'other'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'

  -- SLA Tracking
  sla_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[], -- Array of tags for categorization
  internal_notes TEXT, -- Hidden from user, admin-only notes
  user_satisfaction_rating INTEGER, -- 1-5 rating after resolution
  user_satisfaction_comment TEXT,

  -- Auto-creation tracking
  auto_created BOOLEAN DEFAULT false,
  auto_created_from TEXT, -- 'dispute', 'protection_claim', 'fraud_signal', 'user_submitted'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_admin ON support_tickets(assigned_admin_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_sla_deadline ON support_tickets(sla_deadline) WHERE status IN ('open', 'in_progress');

-- Auto-update timestamp
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. SUPPORT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message Details
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'admin', 'user', 'system'
  is_internal BOOLEAN DEFAULT false, -- Internal admin notes not visible to user

  -- Attachments
  attachment_urls TEXT[], -- Array of file URLs

  -- Metadata
  read_by_user BOOLEAN DEFAULT false,
  read_by_admin BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id, created_at);
CREATE INDEX idx_support_messages_sender ON support_messages(sender_id);
CREATE INDEX idx_support_messages_unread_user ON support_messages(ticket_id, read_by_user) WHERE sender_type = 'admin' AND is_internal = false;
CREATE INDEX idx_support_messages_unread_admin ON support_messages(ticket_id, read_by_admin) WHERE sender_type = 'user';

-- =====================================================
-- 3. CANNED RESPONSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Response Details
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- Matches ticket categories
  shortcode TEXT UNIQUE, -- Quick access code, e.g., 'refund-policy'

  -- Variables support (e.g., {{user_name}}, {{order_number}})
  variables TEXT[], -- Array of variable names used in template

  -- Metadata
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_canned_responses_category ON support_canned_responses(category);
CREATE INDEX idx_canned_responses_active ON support_canned_responses(is_active) WHERE is_active = true;
CREATE INDEX idx_canned_responses_usage ON support_canned_responses(usage_count DESC);

-- Auto-update timestamp
CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON support_canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. KNOWLEDGE BASE ARTICLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Article Details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL,

  -- SEO & Discoverability
  keywords TEXT[], -- Search keywords
  related_article_ids UUID[], -- Related articles

  -- Visibility
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_kb_articles_category ON support_kb_articles(category);
CREATE INDEX idx_kb_articles_published ON support_kb_articles(is_published) WHERE is_published = true;
CREATE INDEX idx_kb_articles_featured ON support_kb_articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_kb_articles_views ON support_kb_articles(view_count DESC);
CREATE INDEX idx_kb_articles_helpful ON support_kb_articles(helpful_count DESC);

-- Full-text search
CREATE INDEX idx_kb_articles_search ON support_kb_articles USING gin(to_tsvector('english', title || ' ' || content || ' ' || coalesce(excerpt, '')));

-- Auto-update timestamp
CREATE TRIGGER update_kb_articles_updated_at
  BEFORE UPDATE ON support_kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TICKET ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_ticket_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Activity Details
  activity_type TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'priority_changed', 'message_sent', 'resolved', 'reopened', 'closed'
  old_value TEXT,
  new_value TEXT,
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ticket_activity_ticket ON support_ticket_activity(ticket_id, created_at DESC);
CREATE INDEX idx_ticket_activity_actor ON support_ticket_activity(actor_id);

-- =====================================================
-- 6. SUPPORT METRICS CACHE TABLE
-- =====================================================
-- Materialized view for fast analytics queries
CREATE TABLE IF NOT EXISTS support_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  date DATE NOT NULL UNIQUE,

  -- Volume Metrics
  tickets_created INTEGER DEFAULT 0,
  tickets_resolved INTEGER DEFAULT 0,
  tickets_closed INTEGER DEFAULT 0,

  -- Response Metrics
  avg_first_response_minutes INTEGER,
  avg_resolution_minutes INTEGER,

  -- SLA Metrics
  sla_met_count INTEGER DEFAULT 0,
  sla_breached_count INTEGER DEFAULT 0,

  -- Category Breakdown (JSON for flexibility)
  tickets_by_category JSONB,
  tickets_by_priority JSONB,

  -- Satisfaction
  avg_satisfaction_rating NUMERIC(3,2),
  satisfaction_responses INTEGER DEFAULT 0,

  -- Admin Performance
  tickets_by_admin JSONB,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_support_metrics_date ON support_metrics_daily(date DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Support Tickets: Admins see all, users see their own
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'city_moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'city_moderator')
      AND is_active = true
    )
  );

-- Support Messages: Same as tickets
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see messages for their tickets"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND user_id = auth.uid()
    )
    AND is_internal = false -- Users can't see internal notes
  );

CREATE POLICY "Admins see all messages"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'city_moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Users can send messages on their tickets"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can send messages"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'city_moderator')
      AND is_active = true
    )
  );

-- Canned Responses: Admin-only
ALTER TABLE support_canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage canned responses"
  ON support_canned_responses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'city_moderator')
      AND is_active = true
    )
  );

-- KB Articles: Public read, admin write
ALTER TABLE support_kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published KB articles"
  ON support_kb_articles FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage KB articles"
  ON support_kb_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'city_moderator')
      AND is_active = true
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT := to_char(now(), 'YYYYMMDD');
  count INTEGER;
  ticket_num TEXT;
BEGIN
  -- Get count of tickets today
  SELECT COUNT(*) INTO count
  FROM support_tickets
  WHERE ticket_number LIKE 'TKT-' || today || '-%';

  -- Generate ticket number
  ticket_num := 'TKT-' || today || '-' || LPAD((count + 1)::TEXT, 4, '0');

  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SLA deadline based on priority
CREATE OR REPLACE FUNCTION calculate_sla_deadline(priority_level TEXT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE priority_level
    WHEN 'critical' THEN RETURN now() + INTERVAL '2 hours';
    WHEN 'high' THEN RETURN now() + INTERVAL '8 hours';
    WHEN 'normal' THEN RETURN now() + INTERVAL '24 hours';
    WHEN 'low' THEN RETURN now() + INTERVAL '48 hours';
    ELSE RETURN now() + INTERVAL '24 hours';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set ticket number and SLA deadline on insert
CREATE OR REPLACE FUNCTION set_ticket_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;

  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := calculate_sla_deadline(NEW.priority);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_support_ticket_defaults
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_defaults();

-- Trigger to log ticket activity
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO support_ticket_activity (ticket_id, actor_id, activity_type, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;

  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND OLD.assigned_admin_id IS DISTINCT FROM NEW.assigned_admin_id THEN
    INSERT INTO support_ticket_activity (ticket_id, actor_id, activity_type, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'assigned', OLD.assigned_admin_id::TEXT, NEW.assigned_admin_id::TEXT, 'Ticket reassigned');
  END IF;

  -- Log priority changes
  IF TG_OP = 'UPDATE' AND OLD.priority != NEW.priority THEN
    INSERT INTO support_ticket_activity (ticket_id, actor_id, activity_type, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority, NEW.priority, 'Priority changed from ' || OLD.priority || ' to ' || NEW.priority);
  END IF;

  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO support_ticket_activity (ticket_id, actor_id, activity_type, description)
    VALUES (NEW.id, NEW.user_id, 'created', 'Ticket created');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_support_ticket_activity
  AFTER INSERT OR UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_activity();

-- =====================================================
-- SEED DATA - Default Canned Responses
-- =====================================================

INSERT INTO support_canned_responses (title, content, category, shortcode, variables) VALUES
('Order Status Inquiry', 'Hi {{user_name}},

Thank you for reaching out about order {{order_number}}.

I''ve checked your order status and it is currently {{order_status}}. {{additional_details}}

If you have any other questions, please don''t hesitate to ask!

Best regards,
{{admin_name}}', 'order_issue', 'order-status', ARRAY['user_name', 'order_number', 'order_status', 'additional_details', 'admin_name']),

('Refund Policy', 'Hi {{user_name}},

Our refund policy is as follows:

- Buyers may request refunds within 30 days of purchase
- Items must be returned in original condition
- Refunds are processed within 5-7 business days

For your specific case regarding order {{order_number}}, {{custom_message}}

Best regards,
{{admin_name}}', 'billing', 'refund-policy', ARRAY['user_name', 'order_number', 'custom_message', 'admin_name']),

('Account Verification', 'Hi {{user_name}},

To verify your account, please:

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

Once completed, we''ll review your submission within 24 hours.

Best regards,
{{admin_name}}', 'account', 'account-verify', ARRAY['user_name', 'step_1', 'step_2', 'step_3', 'admin_name']),

('Technical Support', 'Hi {{user_name}},

Thank you for reporting this technical issue. {{issue_description}}

Our team is investigating and we''ll update you within {{timeframe}}.

In the meantime, you can try: {{troubleshooting_steps}}

Best regards,
{{admin_name}}', 'technical', 'tech-support', ARRAY['user_name', 'issue_description', 'timeframe', 'troubleshooting_steps', 'admin_name']);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
