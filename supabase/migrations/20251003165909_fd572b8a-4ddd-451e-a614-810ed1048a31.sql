-- Add escrow and pickup tracking fields to orders table
ALTER TABLE orders
ADD COLUMN payment_hold_status text DEFAULT 'pending' CHECK (payment_hold_status IN ('pending', 'authorized', 'captured', 'released', 'refunded')),
ADD COLUMN pickup_confirmed_at timestamp with time zone,
ADD COLUMN geo_checkin_data jsonb,
ADD COLUMN escrow_release_date timestamp with time zone,
ADD COLUMN payment_authorized_at timestamp with time zone,
ADD COLUMN buyer_geo_confirmed boolean DEFAULT false,
ADD COLUMN seller_handoff_confirmed boolean DEFAULT false;

-- Create order reminders table for automated notifications
CREATE TABLE order_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('pickup_ready', 'pickup_reminder', 'pickup_overdue', 'seller_prepare')),
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  recipient_id uuid NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on order_reminders
ALTER TABLE order_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminders
CREATE POLICY "Users can view their own reminders"
ON order_reminders FOR SELECT
USING (auth.uid() = recipient_id);

-- System can create reminders
CREATE POLICY "System can create reminders"
ON order_reminders FOR INSERT
WITH CHECK (true);

-- System can update reminders
CREATE POLICY "System can update reminders"
ON order_reminders FOR UPDATE
USING (true);

-- Create index for efficient reminder queries
CREATE INDEX idx_order_reminders_scheduled ON order_reminders(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX idx_order_reminders_order ON order_reminders(order_id);