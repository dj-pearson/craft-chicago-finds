-- Create carts table for abandoned cart tracking
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reminder_sent_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own cart"
ON carts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient abandoned cart queries
CREATE INDEX IF NOT EXISTS idx_carts_abandoned 
ON carts(updated_at, reminder_sent_at) 
WHERE reminder_sent_at IS NULL;

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();