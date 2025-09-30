-- Create a function to seed mock seller data for testing
-- This should be run by a logged-in user who will become the mock seller

CREATE OR REPLACE FUNCTION seed_mock_seller_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_user_id uuid;
  chicago_city_id uuid;
  jewelry_category_id uuid;
  art_category_id uuid;
  listing_count integer;
BEGIN
  -- Get the current user ID
  seller_user_id := auth.uid();
  
  IF seller_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No authenticated user found. Please log in first.');
  END IF;

  -- Get Chicago city ID (or create it if it doesn't exist)
  SELECT id INTO chicago_city_id FROM cities WHERE slug = 'chicago' LIMIT 1;
  
  IF chicago_city_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Chicago city not found in database');
  END IF;

  -- Get category IDs
  SELECT id INTO jewelry_category_id FROM categories WHERE slug = 'jewelry' AND city_id = chicago_city_id LIMIT 1;
  SELECT id INTO art_category_id FROM categories WHERE slug = 'art' AND city_id = chicago_city_id LIMIT 1;

  -- Update profile to be a seller with mock data
  UPDATE profiles
  SET 
    is_seller = true,
    seller_verified = true,
    display_name = 'Test Artisan Shop',
    bio = 'A test seller account for development and testing purposes. Products are out of stock.',
    seller_description = 'Welcome to our test shop! These are sample listings to demonstrate the platform.',
    location = 'Chicago, IL',
    city_id = chicago_city_id
  WHERE user_id = seller_user_id;

  -- Check if listings already exist for this user
  SELECT COUNT(*) INTO listing_count FROM listings WHERE seller_id = seller_user_id;
  
  IF listing_count > 0 THEN
    RETURN jsonb_build_object('message', 'Mock seller data already exists for this user', 'listings_count', listing_count);
  END IF;

  -- Insert mock listings (all out of stock)
  INSERT INTO listings (
    seller_id, city_id, category_id, title, description, price, 
    inventory_count, status, images, tags, local_pickup_available, 
    shipping_available, pickup_location
  ) VALUES
  (
    seller_user_id, chicago_city_id, jewelry_category_id,
    'Handcrafted Silver Necklace',
    'Beautiful handmade silver necklace with intricate design. This is a test product and is not available for purchase.',
    89.99, 0, 'active',
    ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
    ARRAY['jewelry', 'handmade', 'silver', 'necklace', 'test'],
    true, false, 'Downtown Chicago'
  ),
  (
    seller_user_id, chicago_city_id, jewelry_category_id,
    'Artisan Leather Bracelet',
    'Hand-stitched leather bracelet with brass accents. Test listing - currently out of stock.',
    45.00, 0, 'active',
    ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800'],
    ARRAY['jewelry', 'leather', 'handmade', 'bracelet', 'test'],
    true, false, 'Downtown Chicago'
  ),
  (
    seller_user_id, chicago_city_id, art_category_id,
    'Abstract Canvas Painting',
    'Original abstract art piece on canvas. Perfect for modern spaces. This is a demonstration listing only.',
    250.00, 0, 'active',
    ARRAY['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800'],
    ARRAY['art', 'painting', 'canvas', 'abstract', 'original', 'test'],
    true, true, 'Logan Square Studio'
  ),
  (
    seller_user_id, chicago_city_id, art_category_id,
    'Ceramic Coffee Mug Set',
    'Set of 2 hand-thrown ceramic mugs with unique glaze. Test product - not for sale.',
    65.00, 0, 'active',
    ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800'],
    ARRAY['ceramics', 'pottery', 'handmade', 'mugs', 'test'],
    true, true, 'Wicker Park Studio'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Mock seller data created successfully',
    'seller_id', seller_user_id,
    'listings_created', 4
  );
END;
$$;