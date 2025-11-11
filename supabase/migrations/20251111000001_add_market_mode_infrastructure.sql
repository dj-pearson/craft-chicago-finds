-- ========================================
-- MARKET MODE INFRASTRUCTURE - PHASE 2
-- Created: 2025-11-11
-- Purpose: Physical + Digital craft fair integration
-- Strategic Value: Infrastructure differentiat or that bridges
-- physical craft fairs with digital commerce
-- ========================================

-- Table: craft_fairs
-- Stores information about craft fairs and markets
CREATE TABLE IF NOT EXISTS public.craft_fairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  organizer_name TEXT,
  organizer_contact TEXT,

  -- Location
  venue_name TEXT,
  venue_address TEXT NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,

  -- Dates and times
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  setup_time TIME,
  event_hours TEXT, -- e.g. "10am-6pm Saturday, 11am-5pm Sunday"

  -- Fair details
  booth_count INTEGER,
  expected_attendance INTEGER,
  admission_fee DECIMAL(10,2),
  categories TEXT[] DEFAULT '{}', -- Categories featured at this fair

  -- Images
  banner_image_url TEXT,
  logo_image_url TEXT,
  venue_image_urls TEXT[] DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  market_mode_enabled BOOLEAN DEFAULT false, -- Whether Market Mode is available for this fair

  -- Metadata
  website_url TEXT,
  social_media JSONB DEFAULT '{}', -- {instagram: "...", facebook: "..."}
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: fair_participants
-- Sellers registered to participate in specific fairs
CREATE TABLE IF NOT EXISTS public.fair_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fair_id UUID NOT NULL REFERENCES public.craft_fairs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Booth information
  booth_number TEXT,
  booth_location TEXT, -- e.g. "Main Hall, Row 3"
  booth_size TEXT, -- e.g. "10x10"

  -- Participation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled')),
  application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmation_date TIMESTAMP WITH TIME ZONE,

  -- Market Mode opt-in
  market_mode_enabled BOOLEAN DEFAULT false,
  qr_code_url TEXT, -- Generated QR code linking to seller's Market Mode page

  -- Metadata
  notes TEXT,
  special_requirements TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(fair_id, seller_id)
);

-- Table: market_mode_sessions
-- Active Market Mode sessions when sellers are at fairs
CREATE TABLE IF NOT EXISTS public.market_mode_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.fair_participants(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fair_id UUID NOT NULL REFERENCES public.craft_fairs(id) ON DELETE CASCADE,

  -- Session details
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Engagement metrics
  qr_scans INTEGER DEFAULT 0,
  catalog_views INTEGER DEFAULT 0,
  items_viewed INTEGER DEFAULT 0,
  reservations_made INTEGER DEFAULT 0,
  orders_placed INTEGER DEFAULT 0,

  -- Session configuration
  available_for_pickup BOOLEAN DEFAULT true,
  available_for_shipping BOOLEAN DEFAULT true,
  pickup_window_start TIME,
  pickup_window_end TIME,
  booth_notes TEXT, -- e.g. "Booth #47, ask for Sarah"

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: market_reservations
-- Customer reservations for booth pickup during Market Mode
CREATE TABLE IF NOT EXISTS public.market_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.market_mode_sessions(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reservation details
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  reservation_code TEXT NOT NULL UNIQUE, -- e.g. "MM-A7B2C9"

  -- Pickup details
  pickup_time TIMESTAMP WITH TIME ZONE,
  pickup_window_start TIMESTAMP WITH TIME ZONE,
  pickup_window_end TIMESTAMP WITH TIME ZONE,
  pickup_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'picked_up', 'no_show', 'cancelled')),

  -- Payment (optional - could reserve without paying, pay at booth)
  payment_intent_id TEXT,
  amount_reserved DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  paid_online BOOLEAN DEFAULT false,

  -- Notifications
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  -- Completion
  picked_up_at TIMESTAMP WITH TIME ZONE,
  confirmed_by_seller BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_craft_fairs_city_id ON public.craft_fairs(city_id);
CREATE INDEX IF NOT EXISTS idx_craft_fairs_status ON public.craft_fairs(status);
CREATE INDEX IF NOT EXISTS idx_craft_fairs_start_date ON public.craft_fairs(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_craft_fairs_slug ON public.craft_fairs(slug);

CREATE INDEX IF NOT EXISTS idx_fair_participants_fair_id ON public.fair_participants(fair_id);
CREATE INDEX IF NOT EXISTS idx_fair_participants_seller_id ON public.fair_participants(seller_id);
CREATE INDEX IF NOT EXISTS idx_fair_participants_status ON public.fair_participants(status);

CREATE INDEX IF NOT EXISTS idx_market_mode_sessions_seller_id ON public.market_mode_sessions(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_mode_sessions_fair_id ON public.market_mode_sessions(fair_id);
CREATE INDEX IF NOT EXISTS idx_market_mode_sessions_active ON public.market_mode_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_market_reservations_session_id ON public.market_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_market_reservations_buyer_id ON public.market_reservations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_market_reservations_seller_id ON public.market_reservations(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_reservations_status ON public.market_reservations(status);
CREATE INDEX IF NOT EXISTS idx_market_reservations_code ON public.market_reservations(reservation_code);

-- Row Level Security (RLS) Policies
ALTER TABLE public.craft_fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fair_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_mode_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_reservations ENABLE ROW LEVEL SECURITY;

-- Policies for craft_fairs
CREATE POLICY "Anyone can view published craft fairs" ON public.craft_fairs
  FOR SELECT USING (status IN ('published', 'active', 'completed'));

CREATE POLICY "Admins can manage all craft fairs" ON public.craft_fairs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for fair_participants
CREATE POLICY "Sellers can view their own participations" ON public.fair_participants
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own participations" ON public.fair_participants
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all participations" ON public.fair_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for market_mode_sessions
CREATE POLICY "Sellers can view their own sessions" ON public.market_mode_sessions
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own sessions" ON public.market_mode_sessions
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Anyone can view active sessions" ON public.market_mode_sessions
  FOR SELECT USING (is_active = true);

-- Policies for market_reservations
CREATE POLICY "Users can view their own reservations" ON public.market_reservations
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create reservations" ON public.market_reservations
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update their reservations" ON public.market_reservations
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Buyers can cancel their reservations" ON public.market_reservations
  FOR UPDATE USING (buyer_id = auth.uid() AND status IN ('reserved', 'confirmed'));

-- Function to generate reservation codes
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding confusing characters
  result TEXT := 'MM-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to auto-generate reservation code on insert
CREATE OR REPLACE FUNCTION set_reservation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reservation_code IS NULL THEN
    NEW.reservation_code := generate_reservation_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_market_reservation
  BEFORE INSERT ON public.market_reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_reservation_code();

-- Function to update Market Mode session metrics
CREATE OR REPLACE FUNCTION increment_market_mode_metric(
  p_session_id UUID,
  p_metric TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_metric
    WHEN 'qr_scans' THEN
      UPDATE market_mode_sessions
      SET qr_scans = qr_scans + p_increment
      WHERE id = p_session_id;
    WHEN 'catalog_views' THEN
      UPDATE market_mode_sessions
      SET catalog_views = catalog_views + p_increment
      WHERE id = p_session_id;
    WHEN 'items_viewed' THEN
      UPDATE market_mode_sessions
      SET items_viewed = items_viewed + p_increment
      WHERE id = p_session_id;
    WHEN 'reservations_made' THEN
      UPDATE market_mode_sessions
      SET reservations_made = reservations_made + p_increment
      WHERE id = p_session_id;
    WHEN 'orders_placed' THEN
      UPDATE market_mode_sessions
      SET orders_placed = orders_placed + p_increment
      WHERE id = p_session_id;
  END CASE;

  RETURN true;
END;
$$;

-- Function to get active Market Mode sellers at a fair
CREATE OR REPLACE FUNCTION get_active_market_mode_sellers(p_fair_id UUID)
RETURNS TABLE(
  seller_id UUID,
  seller_name TEXT,
  booth_number TEXT,
  booth_location TEXT,
  session_id UUID,
  available_for_pickup BOOLEAN,
  available_for_shipping BOOLEAN,
  qr_scans INTEGER,
  catalog_views INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mms.seller_id,
    p.business_name,
    fp.booth_number,
    fp.booth_location,
    mms.id as session_id,
    mms.available_for_pickup,
    mms.available_for_shipping,
    mms.qr_scans,
    mms.catalog_views
  FROM market_mode_sessions mms
  JOIN fair_participants fp ON fp.id = mms.participant_id
  JOIN profiles p ON p.user_id = mms.seller_id
  WHERE mms.fair_id = p_fair_id
    AND mms.is_active = true
  ORDER BY fp.booth_number;
END;
$$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_craft_fairs_updated_at ON public.craft_fairs;
CREATE TRIGGER update_craft_fairs_updated_at
  BEFORE UPDATE ON public.craft_fairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fair_participants_updated_at ON public.fair_participants;
CREATE TRIGGER update_fair_participants_updated_at
  BEFORE UPDATE ON public.fair_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_mode_sessions_updated_at ON public.market_mode_sessions;
CREATE TRIGGER update_market_mode_sessions_updated_at
  BEFORE UPDATE ON public.market_mode_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_reservations_updated_at ON public.market_reservations;
CREATE TRIGGER update_market_reservations_updated_at
  BEFORE UPDATE ON public.market_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- STRATEGIC VALUE DOCUMENTATION
-- ========================================

/*
MARKET MODE INFRASTRUCTURE - COMPETITIVE MOAT:

1. PHYSICAL + DIGITAL BRIDGE:
   - First platform to integrate craft fairs with e-commerce
   - Sellers can display QR codes at booths
   - Buyers can browse full catalog, reserve items, schedule pickup
   - Sell out at booth? Keep selling online for later pickup/shipping

2. DATA CAPTURE:
   - Track engagement: QR scans, catalog views, reservations
   - Measure fair ROI for sellers
   - Understand buyer behavior at physical events
   - Intelligence no other platform has

3. NETWORK EFFECTS:
   - More fairs → more sellers → more buyers → more fairs
   - Fair organizers get digital infrastructure for free
   - Sellers get extended reach beyond booth inventory
   - Buyers get convenience (no cash, no carrying, can browse all booths)

4. REVENUE STREAMS:
   - Transaction fees on Market Mode reservations
   - Premium booth analytics for sellers
   - Fair organizer partnerships (featured placement)
   - Sponsorship opportunities

5. INFRASTRUCTURE POSITIONING:
   - Etsy can't do this - requires local relationships with fair organizers
   - Requires physical + digital integration
   - Requires real-time session management
   - Competitive advantage that compounds over time

PILOT PROGRAM (Spring 2025):
- Randolph Street Market
- Renegade Craft Fair
- One of a Kind Show
- 50 makers in pilot
- Free for 6 months
- Booth signage provided
- Analytics dashboard included

EXPANSION (Summer 2025):
- 10+ Chicago fairs
- 200+ makers using Market Mode
- Regional expansion (Milwaukee, Madison, Indianapolis)
- White-label solution for fair organizers
*/
