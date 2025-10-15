import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SHIPSTATION_API_KEY = Deno.env.get("SHIPSTATION_API_KEY");
const SHIPSTATION_API_SECRET = Deno.env.get("SHIPSTATION_API_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingLabelRequest {
  orderId: string;
  carrier?: string; // 'usps', 'ups', 'fedex'
  serviceCode?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: "ShipStation API credentials not configured. Please add SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET to your edge function secrets." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { orderId, carrier, serviceCode }: ShippingLabelRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!buyer_id(display_name, email),
        seller:profiles!seller_id(display_name, email),
        listings(title, price, weight)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (!order.shipping_address) {
      throw new Error("Order does not have a shipping address");
    }

    const shippingAddress = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : order.shipping_address;

    // Prepare ShipStation API request
    const shipStationAuth = btoa(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`);
    
    const shipmentData = {
      carrierCode: carrier || "usps",
      serviceCode: serviceCode || "usps_priority_mail",
      packageCode: "package",
      confirmation: "delivery",
      shipDate: new Date().toISOString().split('T')[0],
      weight: {
        value: order.listings?.weight || 1,
        units: "ounces"
      },
      shipTo: {
        name: shippingAddress.name || shippingAddress.street,
        street1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.zip,
        country: "US"
      },
      shipFrom: {
        name: order.seller.display_name,
        street1: order.pickup_location || "123 Main St", // Seller should configure
        city: "Chicago",
        state: "IL",
        postalCode: "60601",
        country: "US"
      }
    };

    // Create label via ShipStation
    const response = await fetch("https://ssapi.shipstation.com/shipments/createlabel", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${shipStationAuth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(shipmentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ShipStation API error: ${errorText}`);
    }

    const labelData = await response.json();

    // Update order with tracking info
    await supabase
      .from('orders')
      .update({
        tracking_number: labelData.trackingNumber,
        carrier: labelData.carrierCode,
        shipping_label_url: labelData.labelData, // Base64 PDF
        status: 'confirmed'
      })
      .eq('id', orderId);

    console.log("Shipping label created:", labelData.trackingNumber);

    return new Response(
      JSON.stringify({
        success: true,
        trackingNumber: labelData.trackingNumber,
        labelUrl: labelData.labelData,
        cost: labelData.shipmentCost
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error creating shipping label:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});