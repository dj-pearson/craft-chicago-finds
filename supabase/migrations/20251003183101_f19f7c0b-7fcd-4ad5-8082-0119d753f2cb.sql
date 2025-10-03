-- Fraud Detection System Tables
-- These tables support AI-powered fraud detection while keeping sensitive data in Stripe

-- Table for storing device fingerprints (for device recognition)
CREATE TABLE IF NOT EXISTS public.user_device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint JSONB NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for fraud detection sessions
CREATE TABLE IF NOT EXISTS public.fraud_detection_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_fingerprint JSONB,
  behavioral_data JSONB,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing fraud signals (for ML training and analysis)
CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.fraud_detection_sessions(id) ON DELETE SET NULL,
  order_id UUID,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('velocity', 'behavioral', 'payment', 'device', 'pattern')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  description TEXT NOT NULL,
  metadata JSONB,
  action_required BOOLEAN NOT NULL DEFAULT false,
  action_taken TEXT,
  false_positive BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for fraud detection rules and thresholds
CREATE TABLE IF NOT EXISTS public.fraud_detection_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('velocity', 'behavioral', 'pattern', 'amount', 'device')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  threshold_config JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('log', 'flag', 'review', 'block')),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking fraud review actions (admin decisions)
CREATE TABLE IF NOT EXISTS public.fraud_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.fraud_signals(id) ON DELETE CASCADE,
  order_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'requires_verification', 'escalated')),
  reason TEXT,
  notes TEXT,
  automated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user trust scores (progressive trust system)
CREATE TABLE IF NOT EXISTS public.user_trust_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  verification_level TEXT NOT NULL DEFAULT 'none' CHECK (verification_level IN ('none', 'email', 'phone', 'identity', 'enhanced')),
  successful_transactions INTEGER NOT NULL DEFAULT 0,
  failed_transactions INTEGER NOT NULL DEFAULT 0,
  fraud_signals_count INTEGER NOT NULL DEFAULT 0,
  last_fraud_signal TIMESTAMP WITH TIME ZONE,
  account_age_days INTEGER NOT NULL DEFAULT 0,
  stripe_verification_status TEXT,
  manual_adjustments JSONB DEFAULT '[]'::jsonb,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_device_fingerprints_user_id ON public.user_device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_fingerprints_last_seen ON public.user_device_fingerprints(last_seen);

CREATE INDEX IF NOT EXISTS idx_fraud_detection_sessions_user_id ON public.fraud_detection_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_sessions_session_start ON public.fraud_detection_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_sessions_risk_score ON public.fraud_detection_sessions(risk_score);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_user_id ON public.fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_signal_type ON public.fraud_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_severity ON public.fraud_signals(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_created_at ON public.fraud_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_action_required ON public.fraud_signals(action_required) WHERE action_required = true;

CREATE INDEX IF NOT EXISTS idx_fraud_reviews_signal_id ON public.fraud_reviews(signal_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reviews_user_id ON public.fraud_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reviews_decision ON public.fraud_reviews(decision);

CREATE INDEX IF NOT EXISTS idx_user_trust_scores_trust_score ON public.user_trust_scores(trust_score);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_verification_level ON public.user_trust_scores(verification_level);

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;

-- Users can only see their own device fingerprints
CREATE POLICY "Users can view own device fingerprints" ON public.user_device_fingerprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device fingerprints" ON public.user_device_fingerprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device fingerprints" ON public.user_device_fingerprints
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own fraud sessions
CREATE POLICY "Users can view own fraud sessions" ON public.fraud_detection_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fraud sessions" ON public.fraud_detection_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can see their own fraud signals, admins can see all
CREATE POLICY "Users can view own fraud signals" ON public.fraud_signals
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "System can insert fraud signals" ON public.fraud_signals
  FOR INSERT WITH CHECK (true);

-- Only admins can manage fraud detection rules
CREATE POLICY "Admins can manage fraud rules" ON public.fraud_detection_rules
  FOR ALL USING (is_admin(auth.uid()));

-- Only admins can manage fraud reviews
CREATE POLICY "Admins can manage fraud reviews" ON public.fraud_reviews
  FOR ALL USING (is_admin(auth.uid()));

-- Users can see their own trust scores, admins can see all
CREATE POLICY "Users can view own trust scores" ON public.user_trust_scores
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "System can manage trust scores" ON public.user_trust_scores
  FOR ALL USING (is_admin(auth.uid()));

-- Functions for fraud detection automation

-- Function to update user trust score
CREATE OR REPLACE FUNCTION update_user_trust_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_score INTEGER := 50;
  account_age INTEGER;
  successful_count INTEGER;
  failed_count INTEGER;
  fraud_count INTEGER;
  verification_bonus INTEGER := 0;
  final_score INTEGER;
BEGIN
  -- Get current metrics
  SELECT 
    EXTRACT(days FROM (now() - created_at))::INTEGER,
    COALESCE(successful_transactions, 0),
    COALESCE(failed_transactions, 0),
    COALESCE(fraud_signals_count, 0)
  INTO account_age, successful_count, failed_count, fraud_count
  FROM user_trust_scores 
  WHERE user_id = target_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_trust_scores (user_id, account_age_days)
    VALUES (target_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN 50;
  END IF;

  -- Calculate base score
  current_score := 50;

  -- Account age bonus (up to +20)
  current_score := current_score + LEAST(account_age / 30, 20);

  -- Successful transactions bonus (up to +25)
  current_score := current_score + LEAST(successful_count * 2, 25);

  -- Failed transactions penalty (up to -15)
  current_score := current_score - LEAST(failed_count * 3, 15);

  -- Fraud signals penalty (up to -30)
  current_score := current_score - LEAST(fraud_count * 5, 30);

  -- Verification level bonus
  SELECT 
    CASE verification_level
      WHEN 'email' THEN 5
      WHEN 'phone' THEN 10
      WHEN 'identity' THEN 15
      WHEN 'enhanced' THEN 20
      ELSE 0
    END
  INTO verification_bonus
  FROM user_trust_scores
  WHERE user_id = target_user_id;

  current_score := current_score + verification_bonus;

  -- Ensure score is within bounds
  final_score := GREATEST(0, LEAST(100, current_score));

  -- Update the trust score
  UPDATE user_trust_scores 
  SET 
    trust_score = final_score,
    account_age_days = account_age,
    last_calculated = now(),
    updated_at = now()
  WHERE user_id = target_user_id;

  RETURN final_score;
END;
$$;

-- Function to check if transaction should be flagged
CREATE OR REPLACE FUNCTION should_flag_transaction(
  target_user_id UUID,
  transaction_amount DECIMAL,
  seller_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_trust INTEGER;
  recent_transactions INTEGER;
  high_risk_signals INTEGER;
BEGIN
  -- Get user trust score
  SELECT trust_score INTO user_trust
  FROM user_trust_scores
  WHERE user_id = target_user_id;

  -- Default to medium trust if no score exists
  IF user_trust IS NULL THEN
    user_trust := 50;
  END IF;

  -- Count recent transactions (last 24 hours)
  SELECT COUNT(*) INTO recent_transactions
  FROM orders
  WHERE buyer_id = target_user_id
    AND created_at > now() - interval '24 hours';

  -- Count high-risk fraud signals (last 7 days)
  SELECT COUNT(*) INTO high_risk_signals
  FROM fraud_signals
  WHERE user_id = target_user_id
    AND severity IN ('high', 'critical')
    AND created_at > now() - interval '7 days';

  -- Flag if any of these conditions are met:
  RETURN (
    user_trust < 30 OR
    (transaction_amount > 500 AND user_trust < 50) OR
    recent_transactions > 5 OR
    high_risk_signals > 0 OR
    transaction_amount > 1000
  );
END;
$$;

-- Function to automatically update trust scores after transactions
CREATE OR REPLACE FUNCTION handle_transaction_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update successful transaction count if order completed successfully
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    INSERT INTO user_trust_scores (user_id, successful_transactions)
    VALUES (NEW.buyer_id, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      successful_transactions = user_trust_scores.successful_transactions + 1,
      updated_at = now();

    -- Recalculate trust score
    PERFORM update_user_trust_score(NEW.buyer_id);
  END IF;

  -- Update failed transaction count if order failed
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    INSERT INTO user_trust_scores (user_id, failed_transactions)
    VALUES (NEW.buyer_id, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      failed_transactions = user_trust_scores.failed_transactions + 1,
      updated_at = now();

    -- Recalculate trust score
    PERFORM update_user_trust_score(NEW.buyer_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update trust scores on order status changes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    DROP TRIGGER IF EXISTS trigger_update_trust_score_on_order_completion ON public.orders;
    CREATE TRIGGER trigger_update_trust_score_on_order_completion
      AFTER UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION handle_transaction_completion();
  END IF;
END $$;

-- Function to update fraud signal counts
CREATE OR REPLACE FUNCTION handle_fraud_signal_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update fraud signals count
  INSERT INTO user_trust_scores (user_id, fraud_signals_count, last_fraud_signal)
  VALUES (NEW.user_id, 1, NEW.created_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    fraud_signals_count = user_trust_scores.fraud_signals_count + 1,
    last_fraud_signal = NEW.created_at,
    updated_at = now();

  -- Recalculate trust score
  PERFORM update_user_trust_score(NEW.user_id);

  RETURN NEW;
END;
$$;

-- Trigger to update trust scores on fraud signal creation
DROP TRIGGER IF EXISTS trigger_update_trust_score_on_fraud_signal ON public.fraud_signals;
CREATE TRIGGER trigger_update_trust_score_on_fraud_signal
  AFTER INSERT ON public.fraud_signals
  FOR EACH ROW
  EXECUTE FUNCTION handle_fraud_signal_insert();

-- Insert default fraud detection rules
INSERT INTO public.fraud_detection_rules (rule_name, rule_type, threshold_config, severity, action, description) VALUES
('High Transaction Velocity', 'velocity', '{"max_transactions_per_hour": 5, "max_amount_per_hour": 1000}', 'high', 'review', 'Flag users with more than 5 transactions or $1000 spent in one hour'),
('Suspicious Device Patterns', 'device', '{"require_cookies": true, "block_headless": true}', 'high', 'review', 'Flag transactions from suspicious devices or headless browsers'),
('Behavioral Anomalies', 'behavioral', '{"min_interaction_time": 5, "max_interaction_speed": 10}', 'medium', 'flag', 'Flag users with bot-like behavioral patterns'),
('High Amount First Transaction', 'amount', '{"max_first_transaction": 500}', 'medium', 'review', 'Review high-value first transactions from new users'),
('Round Number Transactions', 'pattern', '{"flag_round_amounts": true, "min_amount": 500}', 'low', 'log', 'Log transactions with round number amounts over $500')
ON CONFLICT (rule_name) DO NOTHING;

-- Add foreign key constraints to orders table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fraud_signals_order_id_fkey' 
      AND table_name = 'fraud_signals'
    ) THEN
      ALTER TABLE public.fraud_signals 
      ADD CONSTRAINT fraud_signals_order_id_fkey 
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fraud_reviews_order_id_fkey' 
      AND table_name = 'fraud_reviews'
    ) THEN
      ALTER TABLE public.fraud_reviews 
      ADD CONSTRAINT fraud_reviews_order_id_fkey 
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;