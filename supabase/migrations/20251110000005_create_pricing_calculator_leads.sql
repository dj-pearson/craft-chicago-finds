-- Create pricing_calculator_leads table for storing lead capture data
CREATE TABLE IF NOT EXISTS pricing_calculator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  shop_name TEXT,
  craft_type TEXT NOT NULL,
  wants_newsletter BOOLEAN DEFAULT true,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_calculator_leads_email ON pricing_calculator_leads(email);

-- Add index on craft_type for analytics
CREATE INDEX IF NOT EXISTS idx_pricing_calculator_leads_craft_type ON pricing_calculator_leads(craft_type);

-- Add index on captured_at for date-based queries
CREATE INDEX IF NOT EXISTS idx_pricing_calculator_leads_captured_at ON pricing_calculator_leads(captured_at DESC);

-- Enable Row Level Security
ALTER TABLE pricing_calculator_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (public access for lead capture)
CREATE POLICY "Allow public lead capture"
  ON pricing_calculator_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to view all leads (for admin analytics)
CREATE POLICY "Allow authenticated users to view leads"
  ON pricing_calculator_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_calculator_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_calculator_leads_updated_at
  BEFORE UPDATE ON pricing_calculator_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_calculator_leads_updated_at();

-- Add comments for documentation
COMMENT ON TABLE pricing_calculator_leads IS 'Stores lead capture data from the pricing calculator tool';
COMMENT ON COLUMN pricing_calculator_leads.email IS 'Email address of the lead';
COMMENT ON COLUMN pricing_calculator_leads.first_name IS 'First name of the lead';
COMMENT ON COLUMN pricing_calculator_leads.shop_name IS 'Optional shop or brand name';
COMMENT ON COLUMN pricing_calculator_leads.craft_type IS 'Type of craft (jewelry, woodwork, etc.)';
COMMENT ON COLUMN pricing_calculator_leads.wants_newsletter IS 'Whether the lead opted in to newsletter';
COMMENT ON COLUMN pricing_calculator_leads.captured_at IS 'When the lead was captured';
