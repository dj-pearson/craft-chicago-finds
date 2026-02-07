-- ADA/WCAG Accessibility Compliance Infrastructure
-- Migration: 20260112000001_accessibility_compliance.sql
-- Description: Creates tables for storing user accessibility preferences,
--              accessibility audits, and compliance tracking

-- ============================================================================
-- USER ACCESSIBILITY PREFERENCES
-- ============================================================================

-- Table for storing individual user accessibility preferences
CREATE TABLE IF NOT EXISTS public.user_accessibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Visual preferences
  high_contrast_mode BOOLEAN DEFAULT false,
  large_text_mode BOOLEAN DEFAULT false,
  reduce_motion BOOLEAN DEFAULT false,
  screen_reader_optimized BOOLEAN DEFAULT false,
  font_size_multiplier DECIMAL(3, 2) DEFAULT 1.00 CHECK (font_size_multiplier >= 0.5 AND font_size_multiplier <= 3.0),
  color_theme TEXT DEFAULT 'system' CHECK (color_theme IN ('light', 'dark', 'system', 'high-contrast-light', 'high-contrast-dark')),

  -- Keyboard preferences
  focus_visible_always BOOLEAN DEFAULT false,
  keyboard_shortcuts_enabled BOOLEAN DEFAULT true,

  -- Content preferences
  auto_play_media BOOLEAN DEFAULT false,
  show_image_descriptions BOOLEAN DEFAULT true,
  simplified_ui BOOLEAN DEFAULT false,

  -- Reading preferences
  line_height_multiplier DECIMAL(3, 2) DEFAULT 1.50 CHECK (line_height_multiplier >= 1.0 AND line_height_multiplier <= 3.0),
  letter_spacing TEXT DEFAULT 'normal' CHECK (letter_spacing IN ('normal', 'wide', 'wider')),
  word_spacing TEXT DEFAULT 'normal' CHECK (word_spacing IN ('normal', 'wide', 'wider')),

  -- Assistive technology
  assistive_technology_type TEXT[],
  screen_reader_name TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_accessibility UNIQUE (user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_accessibility_user_id ON public.user_accessibility_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_accessibility_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can view own accessibility preferences"
  ON public.user_accessibility_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accessibility preferences"
  ON public.user_accessibility_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accessibility preferences"
  ON public.user_accessibility_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accessibility preferences"
  ON public.user_accessibility_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ACCESSIBILITY FEEDBACK AND ISSUES
-- ============================================================================

-- Table for tracking accessibility issues reported by users
CREATE TABLE IF NOT EXISTS public.accessibility_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reporter info (optional for anonymous reports)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reporter_name TEXT,

  -- Issue details
  page_url TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN (
    'navigation',
    'screen_reader',
    'keyboard',
    'visual',
    'content',
    'form',
    'media',
    'other'
  )),
  issue_description TEXT NOT NULL,
  expected_behavior TEXT,

  -- Technical context
  browser TEXT,
  browser_version TEXT,
  operating_system TEXT,
  assistive_technology TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),

  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'confirmed', 'in_progress', 'resolved', 'wont_fix', 'duplicate')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_status ON public.accessibility_feedback(status);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_type ON public.accessibility_feedback(issue_type);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_priority ON public.accessibility_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_page ON public.accessibility_feedback(page_url);

-- Enable RLS
ALTER TABLE public.accessibility_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit accessibility feedback"
  ON public.accessibility_feedback
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own accessibility feedback"
  ON public.accessibility_feedback
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view and manage all feedback
CREATE POLICY "Admins can manage all accessibility feedback"
  ON public.accessibility_feedback
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- ACCESSIBILITY AUDIT LOG
-- ============================================================================

-- Table for storing automated and manual accessibility audit results
CREATE TABLE IF NOT EXISTS public.accessibility_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Audit info
  audit_type TEXT NOT NULL CHECK (audit_type IN ('automated', 'manual', 'user_testing')),
  audit_tool TEXT, -- e.g., 'axe-core', 'WAVE', 'manual review'
  auditor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Scope
  page_url TEXT,
  component_name TEXT,
  scope_description TEXT,

  -- Results
  wcag_level TEXT CHECK (wcag_level IN ('A', 'AA', 'AAA')),
  passed_criteria TEXT[],
  failed_criteria TEXT[],
  warnings TEXT[],

  -- Detailed issues
  issues JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ criterion: "1.1.1", severity: "critical", element: "img", message: "..." }]

  -- Summary
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  serious_issues INTEGER DEFAULT 0,
  moderate_issues INTEGER DEFAULT 0,
  minor_issues INTEGER DEFAULT 0,
  compliance_score DECIMAL(5, 2), -- 0-100

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accessibility_audit_type ON public.accessibility_audit_log(audit_type);
CREATE INDEX IF NOT EXISTS idx_accessibility_audit_page ON public.accessibility_audit_log(page_url);
CREATE INDEX IF NOT EXISTS idx_accessibility_audit_created ON public.accessibility_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.accessibility_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can manage audits
CREATE POLICY "Admins can manage accessibility audits"
  ON public.accessibility_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- WCAG COMPLIANCE STATUS
-- ============================================================================

-- Table for tracking overall WCAG compliance status by criterion
CREATE TABLE IF NOT EXISTS public.wcag_compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WCAG Criterion
  criterion_number TEXT NOT NULL, -- e.g., "1.1.1", "2.1.1"
  criterion_name TEXT NOT NULL,
  wcag_level TEXT NOT NULL CHECK (wcag_level IN ('A', 'AA', 'AAA')),

  -- Compliance status
  status TEXT DEFAULT 'unknown' CHECK (status IN ('compliant', 'partial', 'non_compliant', 'not_applicable', 'unknown')),
  compliance_percentage INTEGER DEFAULT 0 CHECK (compliance_percentage >= 0 AND compliance_percentage <= 100),

  -- Notes and evidence
  implementation_notes TEXT,
  testing_evidence TEXT,
  known_issues TEXT[],

  -- Review tracking
  last_reviewed TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  next_review_due TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_criterion UNIQUE (criterion_number)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_wcag_status_level ON public.wcag_compliance_status(wcag_level);
CREATE INDEX IF NOT EXISTS idx_wcag_status_status ON public.wcag_compliance_status(status);

-- Enable RLS
ALTER TABLE public.wcag_compliance_status ENABLE ROW LEVEL SECURITY;

-- Anyone can view compliance status (public info)
CREATE POLICY "Anyone can view WCAG compliance status"
  ON public.wcag_compliance_status
  FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage WCAG compliance status"
  ON public.wcag_compliance_status
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- CONTENT ACCESSIBILITY METADATA
-- ============================================================================

-- Table for storing accessibility metadata for user-generated content
CREATE TABLE IF NOT EXISTS public.content_accessibility_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN ('listing_image', 'profile_image', 'blog_image', 'product_video', 'document')),
  content_id UUID NOT NULL, -- Reference to the content (listing, profile, blog post, etc.)
  content_url TEXT,

  -- Accessibility attributes
  alt_text TEXT,
  long_description TEXT,
  transcript TEXT, -- For videos/audio
  caption_file_url TEXT, -- For videos

  -- Quality flags
  has_adequate_alt_text BOOLEAN DEFAULT false,
  alt_text_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- AI-generated suggestions (for helping sellers)
  ai_suggested_alt_text TEXT,
  ai_confidence_score DECIMAL(3, 2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_content_accessibility UNIQUE (content_type, content_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_accessibility_type ON public.content_accessibility_metadata(content_type);
CREATE INDEX IF NOT EXISTS idx_content_accessibility_content ON public.content_accessibility_metadata(content_id);
CREATE INDEX IF NOT EXISTS idx_content_accessibility_reviewed ON public.content_accessibility_metadata(alt_text_reviewed);

-- Enable RLS
ALTER TABLE public.content_accessibility_metadata ENABLE ROW LEVEL SECURITY;

-- Content owners can manage their content's accessibility metadata
CREATE POLICY "Users can manage own content accessibility"
  ON public.content_accessibility_metadata
  FOR ALL
  USING (
    -- Check if user owns the referenced content
    EXISTS (
      SELECT 1 FROM public.listings WHERE id = content_id AND seller_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = content_id AND id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update timestamp on changes
CREATE OR REPLACE FUNCTION update_accessibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_user_accessibility_preferences_updated
  BEFORE UPDATE ON public.user_accessibility_preferences
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

CREATE TRIGGER trigger_accessibility_feedback_updated
  BEFORE UPDATE ON public.accessibility_feedback
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

CREATE TRIGGER trigger_wcag_compliance_status_updated
  BEFORE UPDATE ON public.wcag_compliance_status
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

CREATE TRIGGER trigger_content_accessibility_metadata_updated
  BEFORE UPDATE ON public.content_accessibility_metadata
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

-- Function to get user's accessibility preferences with defaults
CREATE OR REPLACE FUNCTION get_user_accessibility_preferences(p_user_id UUID)
RETURNS TABLE (
  high_contrast_mode BOOLEAN,
  large_text_mode BOOLEAN,
  reduce_motion BOOLEAN,
  screen_reader_optimized BOOLEAN,
  font_size_multiplier DECIMAL,
  color_theme TEXT,
  focus_visible_always BOOLEAN,
  keyboard_shortcuts_enabled BOOLEAN,
  auto_play_media BOOLEAN,
  show_image_descriptions BOOLEAN,
  simplified_ui BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(uap.high_contrast_mode, false),
    COALESCE(uap.large_text_mode, false),
    COALESCE(uap.reduce_motion, false),
    COALESCE(uap.screen_reader_optimized, false),
    COALESCE(uap.font_size_multiplier, 1.00),
    COALESCE(uap.color_theme, 'system'),
    COALESCE(uap.focus_visible_always, false),
    COALESCE(uap.keyboard_shortcuts_enabled, true),
    COALESCE(uap.auto_play_media, false),
    COALESCE(uap.show_image_descriptions, true),
    COALESCE(uap.simplified_ui, false)
  FROM (SELECT p_user_id AS user_id) AS input
  LEFT JOIN public.user_accessibility_preferences uap ON uap.user_id = input.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate overall WCAG compliance percentage
CREATE OR REPLACE FUNCTION calculate_wcag_compliance(p_level TEXT DEFAULT 'AA')
RETURNS DECIMAL AS $$
DECLARE
  total_criteria INTEGER;
  compliant_criteria INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_criteria
  FROM public.wcag_compliance_status
  WHERE wcag_level IN (
    CASE
      WHEN p_level = 'A' THEN ARRAY['A']
      WHEN p_level = 'AA' THEN ARRAY['A', 'AA']
      WHEN p_level = 'AAA' THEN ARRAY['A', 'AA', 'AAA']
    END
  )
  AND status != 'not_applicable';

  SELECT COUNT(*) INTO compliant_criteria
  FROM public.wcag_compliance_status
  WHERE wcag_level IN (
    CASE
      WHEN p_level = 'A' THEN ARRAY['A']
      WHEN p_level = 'AA' THEN ARRAY['A', 'AA']
      WHEN p_level = 'AAA' THEN ARRAY['A', 'AA', 'AAA']
    END
  )
  AND status = 'compliant';

  IF total_criteria = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((compliant_criteria::DECIMAL / total_criteria::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED WCAG 2.1 AA CRITERIA
-- ============================================================================

-- Insert WCAG 2.1 Level A and AA success criteria
INSERT INTO public.wcag_compliance_status (criterion_number, criterion_name, wcag_level, status)
VALUES
  -- Principle 1: Perceivable
  ('1.1.1', 'Non-text Content', 'A', 'compliant'),
  ('1.2.1', 'Audio-only and Video-only (Prerecorded)', 'A', 'compliant'),
  ('1.2.2', 'Captions (Prerecorded)', 'A', 'compliant'),
  ('1.2.3', 'Audio Description or Media Alternative (Prerecorded)', 'A', 'compliant'),
  ('1.2.5', 'Audio Description (Prerecorded)', 'AA', 'compliant'),
  ('1.3.1', 'Info and Relationships', 'A', 'compliant'),
  ('1.3.2', 'Meaningful Sequence', 'A', 'compliant'),
  ('1.3.3', 'Sensory Characteristics', 'A', 'compliant'),
  ('1.3.4', 'Orientation', 'AA', 'compliant'),
  ('1.3.5', 'Identify Input Purpose', 'AA', 'compliant'),
  ('1.4.1', 'Use of Color', 'A', 'compliant'),
  ('1.4.2', 'Audio Control', 'A', 'compliant'),
  ('1.4.3', 'Contrast (Minimum)', 'AA', 'compliant'),
  ('1.4.4', 'Resize Text', 'AA', 'compliant'),
  ('1.4.5', 'Images of Text', 'AA', 'compliant'),
  ('1.4.10', 'Reflow', 'AA', 'compliant'),
  ('1.4.11', 'Non-text Contrast', 'AA', 'compliant'),
  ('1.4.12', 'Text Spacing', 'AA', 'compliant'),
  ('1.4.13', 'Content on Hover or Focus', 'AA', 'compliant'),

  -- Principle 2: Operable
  ('2.1.1', 'Keyboard', 'A', 'compliant'),
  ('2.1.2', 'No Keyboard Trap', 'A', 'compliant'),
  ('2.1.4', 'Character Key Shortcuts', 'A', 'compliant'),
  ('2.2.1', 'Timing Adjustable', 'A', 'compliant'),
  ('2.2.2', 'Pause, Stop, Hide', 'A', 'compliant'),
  ('2.3.1', 'Three Flashes or Below Threshold', 'A', 'compliant'),
  ('2.4.1', 'Bypass Blocks', 'A', 'compliant'),
  ('2.4.2', 'Page Titled', 'A', 'compliant'),
  ('2.4.3', 'Focus Order', 'A', 'compliant'),
  ('2.4.4', 'Link Purpose (In Context)', 'A', 'compliant'),
  ('2.4.5', 'Multiple Ways', 'AA', 'compliant'),
  ('2.4.6', 'Headings and Labels', 'AA', 'compliant'),
  ('2.4.7', 'Focus Visible', 'AA', 'compliant'),
  ('2.5.1', 'Pointer Gestures', 'A', 'compliant'),
  ('2.5.2', 'Pointer Cancellation', 'A', 'compliant'),
  ('2.5.3', 'Label in Name', 'A', 'compliant'),
  ('2.5.4', 'Motion Actuation', 'A', 'compliant'),

  -- Principle 3: Understandable
  ('3.1.1', 'Language of Page', 'A', 'compliant'),
  ('3.1.2', 'Language of Parts', 'AA', 'compliant'),
  ('3.2.1', 'On Focus', 'A', 'compliant'),
  ('3.2.2', 'On Input', 'A', 'compliant'),
  ('3.2.3', 'Consistent Navigation', 'AA', 'compliant'),
  ('3.2.4', 'Consistent Identification', 'AA', 'compliant'),
  ('3.3.1', 'Error Identification', 'A', 'compliant'),
  ('3.3.2', 'Labels or Instructions', 'A', 'compliant'),
  ('3.3.3', 'Error Suggestion', 'AA', 'compliant'),
  ('3.3.4', 'Error Prevention (Legal, Financial, Data)', 'AA', 'compliant'),

  -- Principle 4: Robust
  ('4.1.1', 'Parsing', 'A', 'compliant'),
  ('4.1.2', 'Name, Role, Value', 'A', 'compliant'),
  ('4.1.3', 'Status Messages', 'AA', 'compliant')
ON CONFLICT (criterion_number) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_accessibility_preferences TO authenticated;
GRANT SELECT, INSERT ON public.accessibility_feedback TO anon, authenticated;
GRANT SELECT ON public.wcag_compliance_status TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.content_accessibility_metadata TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_accessibility_preferences IS 'Stores user-specific accessibility preferences (high contrast, large text, reduced motion, etc.)';
COMMENT ON TABLE public.accessibility_feedback IS 'Tracks accessibility issues and feedback reported by users';
COMMENT ON TABLE public.accessibility_audit_log IS 'Logs automated and manual accessibility audits';
COMMENT ON TABLE public.wcag_compliance_status IS 'Tracks WCAG 2.1 compliance status by criterion';
COMMENT ON TABLE public.content_accessibility_metadata IS 'Stores accessibility metadata for user-generated content (alt text, transcripts, etc.)';
