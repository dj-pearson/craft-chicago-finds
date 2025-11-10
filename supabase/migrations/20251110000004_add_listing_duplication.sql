-- Migration: Add Listing Duplication Feature
-- Date: 2025-11-10
-- Purpose: Allow vendors to quickly duplicate listings as a starting point for similar products

-- ============================================================================
-- FUNCTION: Duplicate Listing
-- ============================================================================

CREATE OR REPLACE FUNCTION duplicate_listing(
  p_listing_id UUID,
  p_seller_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_listing_id UUID;
  v_original_listing RECORD;
BEGIN
  -- Verify the listing belongs to the seller
  SELECT * INTO v_original_listing
  FROM listings
  WHERE id = p_listing_id AND seller_id = p_seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or access denied';
  END IF;

  -- Create the duplicate listing
  INSERT INTO listings (
    seller_id,
    title,
    description,
    price,
    category_id,
    subcategory_id,
    city,
    images,
    tags,
    condition,
    shipping_available,
    local_pickup,
    local_delivery,
    dimensions,
    weight,
    materials,
    care_instructions,
    customization_available,
    customization_details,
    production_time,
    inventory_count,
    low_stock_threshold,
    auto_hide_out_of_stock,
    status,
    is_active,
    custom_fields,
    seo_title,
    seo_description,
    seo_keywords
  )
  SELECT
    seller_id,
    v_original_listing.title || ' (Copy)',  -- Add (Copy) to the title
    description,
    price,
    category_id,
    subcategory_id,
    city,
    images,
    tags,
    condition,
    shipping_available,
    local_pickup,
    local_delivery,
    dimensions,
    weight,
    materials,
    care_instructions,
    customization_available,
    customization_details,
    production_time,
    0,  -- Reset inventory to 0
    low_stock_threshold,
    auto_hide_out_of_stock,
    'draft',  -- Always create as draft
    false,  -- Not active by default
    custom_fields,
    seo_title,
    seo_description,
    seo_keywords
  FROM listings
  WHERE id = p_listing_id
  RETURNING id INTO v_new_listing_id;

  -- Log the duplication action
  INSERT INTO inventory_alerts (
    listing_id,
    seller_id,
    alert_type,
    inventory_count,
    metadata
  ) VALUES (
    v_new_listing_id,
    p_seller_id,
    'inventory_updated',
    0,
    jsonb_build_object(
      'action', 'duplicated_from',
      'original_listing_id', p_listing_id,
      'title', v_original_listing.title || ' (Copy)'
    )
  );

  RETURN v_new_listing_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Bulk Toggle Listing Status
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_toggle_listing_status(
  p_listing_ids UUID[],
  p_seller_id UUID,
  p_new_status VARCHAR(20)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_listing_id UUID;
BEGIN
  -- Validate status
  IF p_new_status NOT IN ('draft', 'active', 'inactive', 'sold') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Update each listing
  FOREACH v_listing_id IN ARRAY p_listing_ids
  LOOP
    UPDATE listings
    SET
      status = p_new_status,
      is_active = CASE
        WHEN p_new_status = 'active' THEN true
        ELSE false
      END,
      updated_at = NOW()
    WHERE id = v_listing_id AND seller_id = p_seller_id;

    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'updated_count', v_updated_count,
    'requested_count', array_length(p_listing_ids, 1)
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Bulk Update Listing Prices
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_update_listing_prices(
  p_updates JSONB,
  p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_update JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Loop through updates
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    BEGIN
      UPDATE listings
      SET
        price = (v_update->>'new_price')::DECIMAL(10, 2),
        updated_at = NOW()
      WHERE id = (v_update->>'listing_id')::UUID
        AND seller_id = p_seller_id;

      IF FOUND THEN
        v_success_count := v_success_count + 1;
      ELSE
        v_error_count := v_error_count + 1;
        v_errors := v_errors || jsonb_build_object(
          'listing_id', v_update->>'listing_id',
          'error', 'Listing not found or access denied'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'listing_id', v_update->>'listing_id',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success_count', v_success_count,
    'error_count', v_error_count,
    'errors', v_errors
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Bulk Update Listing Fields
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_update_listing_fields(
  p_listing_ids UUID[],
  p_seller_id UUID,
  p_fields JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_listing_id UUID;
  v_update_query TEXT;
  v_set_clauses TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Build SET clauses dynamically based on provided fields
  IF p_fields ? 'price' THEN
    v_set_clauses := array_append(v_set_clauses, format('price = %s', (p_fields->>'price')::DECIMAL(10, 2)));
  END IF;

  IF p_fields ? 'inventory_count' THEN
    v_set_clauses := array_append(v_set_clauses, format('inventory_count = %s', (p_fields->>'inventory_count')::INTEGER));
  END IF;

  IF p_fields ? 'low_stock_threshold' THEN
    v_set_clauses := array_append(v_set_clauses, format('low_stock_threshold = %s', (p_fields->>'low_stock_threshold')::INTEGER));
  END IF;

  IF p_fields ? 'shipping_available' THEN
    v_set_clauses := array_append(v_set_clauses, format('shipping_available = %s', (p_fields->>'shipping_available')::BOOLEAN));
  END IF;

  IF p_fields ? 'local_pickup' THEN
    v_set_clauses := array_append(v_set_clauses, format('local_pickup = %s', (p_fields->>'local_pickup')::BOOLEAN));
  END IF;

  IF p_fields ? 'local_delivery' THEN
    v_set_clauses := array_append(v_set_clauses, format('local_delivery = %s', (p_fields->>'local_delivery')::BOOLEAN));
  END IF;

  IF array_length(v_set_clauses, 1) = 0 THEN
    RAISE EXCEPTION 'No valid fields provided for update';
  END IF;

  -- Update each listing
  FOREACH v_listing_id IN ARRAY p_listing_ids
  LOOP
    IF p_fields ? 'price' THEN
      UPDATE listings SET price = (p_fields->>'price')::DECIMAL(10, 2)
      WHERE id = v_listing_id AND seller_id = p_seller_id;
    END IF;

    IF p_fields ? 'inventory_count' THEN
      UPDATE listings SET inventory_count = (p_fields->>'inventory_count')::INTEGER
      WHERE id = v_listing_id AND seller_id = p_seller_id;
    END IF;

    IF p_fields ? 'low_stock_threshold' THEN
      UPDATE listings SET low_stock_threshold = (p_fields->>'low_stock_threshold')::INTEGER
      WHERE id = v_listing_id AND seller_id = p_seller_id;
    END IF;

    IF p_fields ? 'shipping_available' THEN
      UPDATE listings SET shipping_available = (p_fields->>'shipping_available')::BOOLEAN
      WHERE id = v_listing_id AND seller_id = p_seller_id;
    END IF;

    IF p_fields ? 'local_pickup' THEN
      UPDATE listings SET local_pickup = (p_fields->>'local_pickup')::BOOLEAN
      WHERE id = v_listing_id AND seller_id = p_seller_id;
    END IF;

    IF p_fields ? 'local_delivery' THEN
      UPDATE listings SET local_delivery = (p_fields->>'local_delivery')::BOOLEAN
      WHERE id = v_listing_id AND seller_id = p_seller_id;
    END IF;

    -- Update timestamp
    UPDATE listings SET updated_at = NOW()
    WHERE id = v_listing_id AND seller_id = p_seller_id;

    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'updated_count', v_updated_count,
    'requested_count', array_length(p_listing_ids, 1)
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION duplicate_listing TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_toggle_listing_status TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_listing_prices TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_listing_fields TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION duplicate_listing IS 'Duplicates a listing as a draft with (Copy) appended to title and inventory reset to 0';
COMMENT ON FUNCTION bulk_toggle_listing_status IS 'Updates the status of multiple listings at once';
COMMENT ON FUNCTION bulk_update_listing_prices IS 'Updates prices for multiple listings from a JSON array';
COMMENT ON FUNCTION bulk_update_listing_fields IS 'Updates multiple fields for selected listings in bulk';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Listing duplication and bulk operations migration completed successfully!';
  RAISE NOTICE 'Vendors can now duplicate listings and perform bulk updates.';
END $$;
