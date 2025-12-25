import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Simple HTML sanitization for notes field
function sanitizeNotes(input: string | null | undefined): string | null {
  if (!input) return null;
  // Remove HTML tags and limit length
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500);
}

// Sanitize guest info to prevent injection
function sanitizeGuestInfo(info: GuestInfo): GuestInfo {
  return {
    name: info.name?.replace(/<[^>]*>/g, '').trim().slice(0, 100) || '',
    email: info.email?.trim().toLowerCase().slice(0, 255) || '',
    phone: info.phone?.replace(/[^0-9+\-() ]/g, '').slice(0, 20),
    address: info.address?.replace(/<[^>]*>/g, '').trim().slice(0, 200),
    city: info.city?.replace(/<[^>]*>/g, '').trim().slice(0, 100),
    state: info.state?.replace(/<[^>]*>/g, '').trim().slice(0, 50),
    zip: info.zip?.replace(/[^0-9\-]/g, '').slice(0, 10),
  };
}

interface CartItem {
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  seller_id: string;
  seller_name: string;
}

interface GuestInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      cart_items,
      guest_info,
      fulfillment_method,
      shipping_address,
      notes,
      send_magic_link,
      success_url,
      cancel_url
    }: {
      cart_items: CartItem[];
      guest_info: GuestInfo;
      fulfillment_method: string;
      shipping_address: any;
      notes?: string;
      send_magic_link: boolean;
      success_url: string;
      cancel_url: string;
    } = await req.json();

    // Sanitize guest info
    const sanitizedGuestInfo = sanitizeGuestInfo(guest_info);
    const sanitizedNotes = sanitizeNotes(notes);

    console.log('Creating guest checkout for:', sanitizedGuestInfo.email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedGuestInfo.email)) {
      throw new Error('Invalid email address');
    }

    if (!cart_items || cart_items.length === 0) {
      throw new Error('Cart is empty');
    }

    // ============================================
    // SECURITY: Verify prices from database
    // Never trust client-provided prices
    // ============================================
    const listingIds = cart_items.map((item: CartItem) => item.listing_id);

    const { data: listings, error: listingsError } = await supabaseClient
      .from('listings')
      .select('id, title, price, seller_id, quantity, status, profiles!listings_seller_id_fkey(display_name)')
      .in('id', listingIds);

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      throw new Error('Failed to verify product prices');
    }

    if (!listings || listings.length !== listingIds.length) {
      throw new Error('One or more products not found or no longer available');
    }

    // Create a map for quick lookup
    const listingMap = new Map(listings.map(l => [l.id, l]));

    // Verify each item and build secure cart
    const verifiedItems: any[] = [];
    for (const clientItem of cart_items) {
      const dbListing = listingMap.get(clientItem.listing_id);

      if (!dbListing) {
        throw new Error(`Product not found: ${clientItem.listing_id}`);
      }

      if (dbListing.status !== 'active') {
        throw new Error(`Product is no longer available: ${dbListing.title}`);
      }

      // Check inventory
      if (dbListing.quantity !== null && dbListing.quantity < clientItem.quantity) {
        throw new Error(`Insufficient inventory for: ${dbListing.title}`);
      }

      // Use database price and seller info, not client-provided
      const sellerName = Array.isArray(dbListing.profiles)
        ? dbListing.profiles[0]?.display_name
        : (dbListing.profiles as any)?.display_name || 'Seller';

      verifiedItems.push({
        listing_id: dbListing.id,
        title: dbListing.title,
        price: dbListing.price, // SECURE: Price from database
        quantity: clientItem.quantity,
        seller_id: dbListing.seller_id,
        seller_name: sellerName,
      });
    }

    // Calculate totals using verified prices
    const subtotal = verifiedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = subtotal * 0.1; // 10% platform fee
    const total = subtotal + platformFee;

    console.log('Verified guest checkout totals:', { subtotal, platformFee, total });

    // Create line items for Stripe using verified data
    const lineItems = verifiedItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          metadata: {
            listing_id: item.listing_id,
            seller_id: item.seller_id,
            seller_name: item.seller_name,
          }
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add platform fee as a separate line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Platform Fee',
          metadata: {
            listing_id: 'platform_fee',
            seller_id: 'platform',
            seller_name: 'Platform Fee',
          }
        },
        unit_amount: Math.round(platformFee * 100),
      },
      quantity: 1,
    });

    // Group verified items by seller for metadata
    const sellerGroups = verifiedItems.reduce((groups, item) => {
      if (!groups[item.seller_id]) {
        groups[item.seller_id] = [];
      }
      groups[item.seller_id].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    // Create checkout session with verified and sanitized data
    const session = await stripe.checkout.sessions.create({
      customer_email: sanitizedGuestInfo.email,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: {
        type: 'guest_cart_checkout',
        guest_name: sanitizedGuestInfo.name,
        guest_email: sanitizedGuestInfo.email,
        guest_phone: sanitizedGuestInfo.phone || '',
        fulfillment_method,
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : '',
        notes: sanitizedNotes || '',
        send_magic_link: send_magic_link.toString(),
        seller_groups: JSON.stringify(Object.keys(sellerGroups)),
        // Store verified cart items for webhook processing
        cart_items: JSON.stringify(verifiedItems.map(item => ({
          listing_id: item.listing_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price: item.price
        }))),
        platform_fee: platformFee.toString(),
      },
      billing_address_collection: 'auto',
      shipping_address_collection: shipping_address ? {
        allowed_countries: ['US'],
      } : undefined,
      phone_number_collection: {
        enabled: true,
      },
      customer_creation: 'if_required',
      payment_intent_data: {
        metadata: {
          type: 'guest_cart_checkout',
          guest_email: sanitizedGuestInfo.email,
        }
      }
    });

    // If magic link is requested, send it
    if (send_magic_link) {
      try {
        // We'll create a temporary access token that can be used to view orders
        // This will be handled in the webhook when the payment succeeds
        console.log('Magic link will be sent after successful payment');
      } catch (linkError) {
        console.error('Error preparing magic link:', linkError);
        // Don't fail the checkout if magic link fails
      }
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error creating guest checkout:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});