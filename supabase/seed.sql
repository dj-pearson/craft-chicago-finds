-- Seed data for CraftLocal marketplace
-- Run this to populate the database with sample data

-- Insert categories
INSERT INTO public.categories (id, name, slug, description, icon_name, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Jewelry', 'jewelry', 'Handcrafted jewelry including necklaces, earrings, and bracelets', 'gem', 1),
  ('22222222-2222-2222-2222-222222222222', 'Home Decor', 'home-decor', 'Unique home decorations and furnishings', 'home', 2),
  ('33333333-3333-3333-3333-333333333333', 'Pottery & Ceramics', 'pottery-ceramics', 'Handmade pottery, ceramics, and clay crafts', 'cup-soda', 3),
  ('44444444-4444-4444-4444-444444444444', 'Textiles', 'textiles', 'Handwoven fabrics, quilts, and textile art', 'shirt', 4),
  ('55555555-5555-5555-5555-555555555555', 'Art & Prints', 'art-prints', 'Original artwork and limited edition prints', 'palette', 5),
  ('66666666-6666-6666-6666-666666666666', 'Candles & Soaps', 'candles-soaps', 'Hand-poured candles and artisan soaps', 'candle', 6),
  ('77777777-7777-7777-7777-777777777777', 'Woodwork', 'woodwork', 'Handcrafted wooden items and furniture', 'hammer', 7),
  ('88888888-8888-8888-8888-888888888888', 'Leather Goods', 'leather-goods', 'Handmade leather bags, wallets, and accessories', 'briefcase', 8)
ON CONFLICT (id) DO NOTHING;

-- Note: Products require real user IDs as artisan_id
-- This is a template - replace 'YOUR_USER_ID' with actual authenticated user IDs
-- Example products (commented out - uncomment and replace user IDs to use):

/*
INSERT INTO public.products (artisan_id, category_id, title, slug, description, price, original_price, stock_quantity, main_image_url, images, featured, tags) VALUES
  (
    'YOUR_USER_ID', 
    '11111111-1111-1111-1111-111111111111',
    'Sterling Silver Moon Phase Necklace',
    'sterling-silver-moon-phase-necklace',
    'Handcrafted sterling silver necklace featuring all eight moon phases. Each phase is carefully carved and polished to perfection. Chain is adjustable 16-18 inches.',
    89.99,
    119.99,
    15,
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    '["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"]'::jsonb,
    true,
    ARRAY['jewelry', 'necklace', 'sterling silver', 'moon', 'celestial']
  ),
  (
    'YOUR_USER_ID',
    '22222222-2222-2222-2222-222222222222',
    'Macrame Wall Hanging - Desert Sunset',
    'macrame-wall-hanging-desert-sunset',
    'Large macrame wall hanging in warm desert tones. Hand-knotted with 100% cotton rope. Perfect statement piece for living rooms or bedrooms. Measures 36" x 48".',
    145.00,
    NULL,
    8,
    'https://images.unsplash.com/photo-1595815771614-7f69cff1c6de?w=800',
    '["https://images.unsplash.com/photo-1595815771614-7f69cff1c6de?w=800"]'::jsonb,
    true,
    ARRAY['home decor', 'macrame', 'wall hanging', 'boho']
  ),
  (
    'YOUR_USER_ID',
    '33333333-3333-3333-3333-333333333333',
    'Hand-Thrown Ceramic Mug Set',
    'hand-thrown-ceramic-mug-set',
    'Set of 4 artisan ceramic mugs. Each piece is wheel-thrown and features a unique reactive glaze in ocean blue. Microwave and dishwasher safe. Holds 12oz.',
    78.00,
    95.00,
    12,
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800',
    '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800", "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800"]'::jsonb,
    false,
    ARRAY['pottery', 'ceramics', 'mug', 'kitchenware']
  ),
  (
    'YOUR_USER_ID',
    '66666666-6666-6666-6666-666666666666',
    'Lavender & Vanilla Soy Candle',
    'lavender-vanilla-soy-candle',
    'Hand-poured soy candle with calming lavender and warm vanilla notes. Made with organic essential oils. Burns for approximately 50 hours. 8oz glass jar.',
    24.00,
    NULL,
    45,
    'https://images.unsplash.com/photo-1602874801006-a4a9baa0d2e5?w=800',
    '["https://images.unsplash.com/photo-1602874801006-a4a9baa0d2e5?w=800"]'::jsonb,
    true,
    ARRAY['candle', 'soy', 'lavender', 'aromatherapy']
  ),
  (
    'YOUR_USER_ID',
    '77777777-7777-7777-7777-777777777777',
    'Walnut Live Edge Cutting Board',
    'walnut-live-edge-cutting-board',
    'Beautiful live edge cutting board crafted from sustainably sourced walnut. Food-safe finish. Each piece features unique natural grain patterns. Dimensions: 18" x 12" x 1.5".',
    125.00,
    NULL,
    6,
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
    '["https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800"]'::jsonb,
    false,
    ARRAY['woodwork', 'cutting board', 'walnut', 'kitchenware']
  ),
  (
    'YOUR_USER_ID',
    '88888888-8888-8888-8888-888888888888',
    'Leather Bifold Wallet - Cognac',
    'leather-bifold-wallet-cognac',
    'Minimalist bifold wallet handcrafted from full-grain vegetable-tanned leather. Features 6 card slots and 2 bill compartments. Will develop beautiful patina over time.',
    68.00,
    NULL,
    20,
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
    '["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800"]'::jsonb,
    false,
    ARRAY['leather', 'wallet', 'accessories', 'minimalist']
  ),
  (
    'YOUR_USER_ID',
    '55555555-5555-5555-5555-555555555555',
    'Abstract Watercolor Print - "Coastal Dreams"',
    'abstract-watercolor-print-coastal-dreams',
    'Limited edition giclee print of original watercolor painting. Inspired by coastal landscapes. Printed on archival paper. Available in 11x14" or 16x20".',
    45.00,
    NULL,
    25,
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
    '["https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800"]'::jsonb,
    true,
    ARRAY['art', 'print', 'watercolor', 'abstract']
  ),
  (
    'YOUR_USER_ID',
    '44444444-4444-4444-4444-444444444444',
    'Hand-Woven Cotton Throw Blanket',
    'hand-woven-cotton-throw-blanket',
    'Cozy throw blanket hand-woven on a traditional loom. 100% organic cotton in natural cream with subtle gray stripes. Perfect for sofas or beds. 50" x 60".',
    95.00,
    115.00,
    10,
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800',
    '["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800"]'::jsonb,
    false,
    ARRAY['textiles', 'blanket', 'cotton', 'home decor']
  );
*/

-- Helper function to get a random user ID (for testing)
-- This function should only be used in development
CREATE OR REPLACE FUNCTION get_sample_user_id() 
RETURNS UUID AS $$
DECLARE
  sample_id UUID;
BEGIN
  -- Try to get the first authenticated user
  SELECT id INTO sample_id 
  FROM auth.users 
  LIMIT 1;
  
  -- If no users exist, return a placeholder
  IF sample_id IS NULL THEN
    RETURN '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;
  
  RETURN sample_id;
END;
$$ LANGUAGE plpgsql;
