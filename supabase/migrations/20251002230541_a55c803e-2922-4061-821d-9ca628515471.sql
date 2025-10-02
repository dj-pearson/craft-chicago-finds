-- INFORM Consumers Act: Seller Verification System
CREATE TABLE seller_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_progress', 'verified', 'rejected', 'suspended')),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'phone', 'email', 'address')),
  
  -- Thresholds tracking
  transaction_count INTEGER NOT NULL DEFAULT 0,
  revenue_30_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_annual DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Verification data (encrypted)
  government_id_url TEXT,
  phone_number TEXT,
  verified_email TEXT,
  verified_address JSONB,
  
  -- Stripe Identity integration
  stripe_verification_session_id TEXT,
  stripe_verification_status TEXT,
  
  -- Compliance tracking
  verification_triggered_at TIMESTAMP WITH TIME ZONE,
  verification_deadline TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  last_warning_sent_at TIMESTAMP WITH TIME ZONE,
  suspension_date TIMESTAMP WITH TIME ZONE,
  
  -- Annual recertification
  next_recertification_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public disclosure for high-volume sellers ($20k+)
CREATE TABLE seller_public_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Public information (INFORM Act requirement)
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  business_address TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Disclosure status
  is_active BOOLEAN NOT NULL DEFAULT true,
  disclosure_required_since DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(seller_id)
);

-- Tax Compliance: W-9 Collection
CREATE TABLE seller_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- W-9 Information (encrypted at application level)
  tax_id_type TEXT CHECK (tax_id_type IN ('ssn', 'ein')),
  tax_id_last_4 TEXT, -- Only store last 4 digits
  legal_name TEXT,
  business_entity_type TEXT CHECK (business_entity_type IN ('individual', 'sole_proprietor', 'llc', 's_corp', 'c_corp', 'partnership')),
  
  -- Addresses
  tax_address JSONB,
  
  -- TIN verification
  tin_verified BOOLEAN NOT NULL DEFAULT false,
  tin_verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Backup withholding
  backup_withholding_exempt BOOLEAN NOT NULL DEFAULT false,
  backup_withholding_rate DECIMAL(5,2) DEFAULT 24.00,
  
  -- W-9 form
  w9_form_url TEXT,
  w9_submitted_at TIMESTAMP WITH TIME ZONE,
  w9_approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(seller_id)
);

-- 1099-K Tracking
CREATE TABLE tax_form_1099k (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  
  -- IRS thresholds ($20k AND 200 transactions)
  total_transactions INTEGER NOT NULL DEFAULT 0,
  gross_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Form generation
  form_required BOOLEAN NOT NULL DEFAULT false,
  form_generated_at TIMESTAMP WITH TIME ZONE,
  form_sent_to_seller_at TIMESTAMP WITH TIME ZONE,
  form_filed_with_irs_at TIMESTAMP WITH TIME ZONE,
  
  -- Form data
  form_pdf_url TEXT,
  form_data JSONB,
  
  -- Filing status
  irs_filing_status TEXT CHECK (irs_filing_status IN ('pending', 'filed', 'corrected', 'void')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(seller_id, tax_year)
);

-- Sales Tax Nexus Tracking
CREATE TABLE sales_tax_nexus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- State tracking
  state TEXT NOT NULL,
  
  -- Nexus thresholds (varies by state)
  transaction_threshold INTEGER NOT NULL DEFAULT 200,
  revenue_threshold DECIMAL(10,2) NOT NULL DEFAULT 100000,
  
  -- Current metrics
  current_transactions INTEGER NOT NULL DEFAULT 0,
  current_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Nexus status
  has_nexus BOOLEAN NOT NULL DEFAULT false,
  nexus_established_date DATE,
  
  -- Registration
  registered_for_tax BOOLEAN NOT NULL DEFAULT false,
  tax_registration_number TEXT,
  registration_date DATE,
  
  -- Filing schedule
  filing_frequency TEXT CHECK (filing_frequency IN ('monthly', 'quarterly', 'annual')),
  last_filing_date DATE,
  next_filing_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(state)
);

-- DMCA Takedown Tracking
CREATE TABLE dmca_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notice details
  notice_type TEXT NOT NULL CHECK (notice_type IN ('takedown', 'counter_notice')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'rejected')),
  
  -- Claimant information
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_address TEXT,
  claimant_signature TEXT,
  
  -- Infringing content
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  infringing_url TEXT NOT NULL,
  original_work_description TEXT NOT NULL,
  
  -- Response
  responded_at TIMESTAMP WITH TIME ZONE,
  response_action TEXT CHECK (response_action IN ('removed', 'restored', 'rejected')),
  response_notes TEXT,
  
  -- Counter-notice (if applicable)
  counter_notice_id UUID REFERENCES dmca_notices(id) ON DELETE SET NULL,
  restoration_date TIMESTAMP WITH TIME ZONE,
  
  -- Deadlines
  response_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seller Performance Tracking
CREATE TABLE seller_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Order metrics
  total_orders INTEGER NOT NULL DEFAULT 0,
  on_time_shipments INTEGER NOT NULL DEFAULT 0,
  late_shipments INTEGER NOT NULL DEFAULT 0,
  canceled_orders INTEGER NOT NULL DEFAULT 0,
  
  -- Customer service
  response_time_avg_hours DECIMAL(10,2),
  messages_responded_24h INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  
  -- Quality metrics
  disputes_filed INTEGER NOT NULL DEFAULT 0,
  disputes_lost INTEGER NOT NULL DEFAULT 0,
  chargebacks INTEGER NOT NULL DEFAULT 0,
  
  -- Ratings
  average_rating DECIMAL(3,2),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  
  -- Performance scores (0-100)
  shipping_score INTEGER,
  communication_score INTEGER,
  quality_score INTEGER,
  overall_score INTEGER,
  
  -- Status
  meets_standards BOOLEAN NOT NULL DEFAULT true,
  warning_sent BOOLEAN NOT NULL DEFAULT false,
  restriction_applied BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(seller_id, period_start, period_end)
);

-- Content Moderation Queue
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content being moderated
  content_type TEXT NOT NULL CHECK (content_type IN ('listing', 'profile', 'review', 'message')),
  content_id UUID NOT NULL,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Moderation details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Automated flagging
  auto_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reasons JSONB, -- Array of reasons
  confidence_score DECIMAL(5,2),
  
  -- Manual review
  assigned_to UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE seller_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_public_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_tax_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_form_1099k ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_tax_nexus ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Seller Verifications
CREATE POLICY "Sellers can view their own verification status"
  ON seller_verifications FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all verifications"
  ON seller_verifications FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies: Public Disclosures
CREATE POLICY "High-volume seller info is publicly viewable"
  ON seller_public_disclosures FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage public disclosures"
  ON seller_public_disclosures FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies: Tax Info (highly restricted)
CREATE POLICY "Sellers can view their own tax info"
  ON seller_tax_info FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own tax info"
  ON seller_tax_info FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own tax info"
  ON seller_tax_info FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can view all tax info"
  ON seller_tax_info FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies: 1099-K
CREATE POLICY "Sellers can view their own 1099-K forms"
  ON tax_form_1099k FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all 1099-K forms"
  ON tax_form_1099k FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies: Sales Tax Nexus
CREATE POLICY "Admins can manage sales tax nexus"
  ON sales_tax_nexus FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies: DMCA
CREATE POLICY "Admins can manage DMCA notices"
  ON dmca_notices FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can submit DMCA notices"
  ON dmca_notices FOR INSERT
  WITH CHECK (true);

-- RLS Policies: Performance Metrics
CREATE POLICY "Sellers can view their own performance"
  ON seller_performance_metrics FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all performance metrics"
  ON seller_performance_metrics FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies: Moderation Queue
CREATE POLICY "Moderators can view moderation queue"
  ON moderation_queue FOR SELECT
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'city_moderator' 
      AND is_active = true
    )
  );

CREATE POLICY "Moderators can update moderation queue"
  ON moderation_queue FOR UPDATE
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'city_moderator' 
      AND is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_seller_verifications_seller_id ON seller_verifications(seller_id);
CREATE INDEX idx_seller_verifications_status ON seller_verifications(verification_status);
CREATE INDEX idx_seller_public_disclosures_active ON seller_public_disclosures(is_active);
CREATE INDEX idx_tax_form_1099k_year ON tax_form_1099k(tax_year);
CREATE INDEX idx_dmca_notices_status ON dmca_notices(status);
CREATE INDEX idx_dmca_notices_listing ON dmca_notices(listing_id);
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX idx_seller_performance_seller ON seller_performance_metrics(seller_id);