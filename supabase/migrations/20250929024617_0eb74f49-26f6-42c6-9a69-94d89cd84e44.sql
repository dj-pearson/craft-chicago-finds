-- Add gift mode fields to orders table
ALTER TABLE public.orders 
ADD COLUMN gift_mode boolean DEFAULT false,
ADD COLUMN gift_message text,
ADD COLUMN gift_recipient_email text,
ADD COLUMN scheduled_ship_date date,
ADD COLUMN hide_prices_on_receipt boolean DEFAULT false;

-- Add ready today fields to listings table
ALTER TABLE public.listings
ADD COLUMN ready_today boolean DEFAULT false,
ADD COLUMN ships_today boolean DEFAULT false,
ADD COLUMN pickup_today boolean DEFAULT false;

-- Create indexes for better performance on new fields
CREATE INDEX idx_listings_ready_today ON public.listings(ready_today) WHERE ready_today = true;
CREATE INDEX idx_listings_ships_today ON public.listings(ships_today) WHERE ships_today = true;
CREATE INDEX idx_listings_pickup_today ON public.listings(pickup_today) WHERE pickup_today = true;