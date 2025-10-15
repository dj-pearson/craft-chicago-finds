-- ============================================
-- CRITICAL AUDIT FIXES - DATABASE MIGRATION
-- Addresses Priority 1 blockers from Audit.md
-- ============================================

-- 1. REVIEW MODERATION SYSTEM
-- Add moderation status to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add moderation fields
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add verified purchase validation
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;

-- Add photo support if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'photos'
  ) THEN
    ALTER TABLE reviews ADD COLUMN photos TEXT[];
  END IF;
END $$;

-- Prevent duplicate reviews per order
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_review_per_order'
  ) THEN
    ALTER TABLE reviews 
    ADD CONSTRAINT unique_review_per_order UNIQUE(order_id, reviewer_id);
  END IF;
END $$;

-- Create index for moderation queue
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 2. REVIEW RESPONSES TABLE
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  response_text TEXT NOT NULL CHECK (LENGTH(response_text) BETWEEN 10 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id)
);

-- Enable RLS on review_responses
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_responses
CREATE POLICY "Anyone can view review responses"
ON review_responses FOR SELECT
USING (true);

CREATE POLICY "Sellers can create responses to their reviews"
ON review_responses FOR INSERT
WITH CHECK (
  seller_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.reviewed_user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can update their own responses"
ON review_responses FOR UPDATE
USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all responses"
ON review_responses FOR ALL
USING (is_admin(auth.uid()));

-- Create index for responses
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_seller_id ON review_responses(seller_id);

-- 3. PROTECTION CLAIMS TABLE
CREATE TABLE IF NOT EXISTS protection_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  claim_type TEXT NOT NULL CHECK (claim_type IN (
    'not_as_described', 'damaged', 'not_received', 
    'wrong_item', 'defective', 'quality_issue'
  )),
  description TEXT NOT NULL CHECK (LENGTH(description) BETWEEN 20 AND 2000),
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'under_review', 'resolved', 'rejected'
  )),
  resolution_type TEXT CHECK (resolution_type IN (
    'refund_full', 'refund_partial', 'replacement', 'deny'
  )),
  resolution_notes TEXT,
  resolution_amount DECIMAL(10,2),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on protection_claims
ALTER TABLE protection_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for protection_claims
CREATE POLICY "Buyers can create protection claims for their orders"
ON protection_claims FOR INSERT
WITH CHECK (
  buyer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.buyer_id = auth.uid()
  )
);

CREATE POLICY "Order participants can view their claims"
ON protection_claims FOR SELECT
USING (
  buyer_id = auth.uid() OR 
  seller_id = auth.uid() OR
  is_admin(auth.uid())
);

CREATE POLICY "Admins can manage all protection claims"
ON protection_claims FOR ALL
USING (is_admin(auth.uid()));

-- Create indexes for protection_claims
CREATE INDEX IF NOT EXISTS idx_protection_claims_status ON protection_claims(status) WHERE status IN ('open', 'under_review');
CREATE INDEX IF NOT EXISTS idx_protection_claims_buyer ON protection_claims(buyer_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_seller ON protection_claims(seller_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_order ON protection_claims(order_id);

-- 4. PROTECTION CLAIM MESSAGES TABLE (for communication)
CREATE TABLE IF NOT EXISTS protection_claim_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES protection_claims(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL CHECK (LENGTH(message) BETWEEN 1 AND 2000),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on protection_claim_messages
ALTER TABLE protection_claim_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for protection_claim_messages
CREATE POLICY "Claim participants can send messages"
ON protection_claim_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM protection_claims pc
    WHERE pc.id = claim_id AND 
    (pc.buyer_id = auth.uid() OR pc.seller_id = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Claim participants can view messages"
ON protection_claim_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM protection_claims pc
    WHERE pc.id = claim_id AND 
    (pc.buyer_id = auth.uid() OR pc.seller_id = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE INDEX IF NOT EXISTS idx_claim_messages_claim_id ON protection_claim_messages(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_messages_created_at ON protection_claim_messages(created_at DESC);

-- 5. UPDATE REVIEWS RLS POLICIES FOR MODERATION
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;

-- Only show approved reviews to public
CREATE POLICY "Public can view approved reviews"
ON reviews FOR SELECT
USING (status = 'approved' OR reviewer_id = auth.uid() OR is_admin(auth.uid()));

-- Buyers can create reviews (will be pending)
DROP POLICY IF EXISTS "Buyers can create reviews for their orders" ON reviews;
CREATE POLICY "Buyers can create reviews for their orders"
ON reviews FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.buyer_id = auth.uid()
  )
);

-- Admins can moderate reviews
CREATE POLICY "Admins can moderate all reviews"
ON reviews FOR UPDATE
USING (is_admin(auth.uid()));

-- 6. CREATE TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to review_responses
DROP TRIGGER IF EXISTS update_review_responses_updated_at ON review_responses;
CREATE TRIGGER update_review_responses_updated_at
  BEFORE UPDATE ON review_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to protection_claims
DROP TRIGGER IF EXISTS update_protection_claims_updated_at ON protection_claims;
CREATE TRIGGER update_protection_claims_updated_at
  BEFORE UPDATE ON protection_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. NOTIFICATION TRIGGER FOR NEW REVIEWS
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for seller about new review
  PERFORM create_notification(
    NEW.reviewed_user_id,
    'review',
    'New Review Received',
    'You received a new ' || NEW.rating || '-star review.',
    '/seller/dashboard',
    NEW.id,
    NEW.reviewer_id,
    jsonb_build_object('rating', NEW.rating, 'order_id', NEW.order_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_new_review ON reviews;
CREATE TRIGGER trigger_notify_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();

-- 8. NOTIFICATION TRIGGER FOR PROTECTION CLAIMS
CREATE OR REPLACE FUNCTION notify_new_protection_claim()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify seller about new protection claim
  PERFORM create_notification(
    NEW.seller_id,
    'protection_claim',
    'Protection Claim Filed',
    'A buyer has filed a protection claim for order #' || LEFT(NEW.order_id::text, 8),
    '/seller/dashboard',
    NEW.id,
    NEW.buyer_id,
    jsonb_build_object('claim_type', NEW.claim_type, 'order_id', NEW.order_id)
  );
  
  -- Notify admins
  INSERT INTO notifications (user_id, type, title, content, action_url, related_id)
  SELECT 
    ur.user_id,
    'protection_claim',
    'New Protection Claim',
    'Claim type: ' || NEW.claim_type,
    '/admin/protection-claims',
    NEW.id
  FROM user_roles ur
  WHERE ur.role = 'admin' AND ur.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_new_protection_claim ON protection_claims;
CREATE TRIGGER trigger_notify_new_protection_claim
  AFTER INSERT ON protection_claims
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_protection_claim();

-- 9. ADD HELPER FUNCTION FOR REVIEW VERIFICATION
CREATE OR REPLACE FUNCTION verify_review_purchase(review_order_id UUID, review_buyer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = review_order_id 
    AND o.buyer_id = review_buyer_id
    AND o.status IN ('delivered', 'completed')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;