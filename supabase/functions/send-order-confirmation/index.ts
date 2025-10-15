import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: "Craft Local <orders@craftchicagofinds.com>",
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderId: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: OrderConfirmationRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order details with buyer and seller info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        buyer:profiles!buyer_id(display_name, email),
        seller:profiles!seller_id(display_name, email),
        listings(title, price)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const buyerEmail = order.buyer.email;
    const sellerEmail = order.seller.email;
    const fulfillmentType = order.fulfillment_type || "shipping";
    const total = order.total_amount || 0;

    // Send confirmation to buyer
    await sendEmail(
      buyerEmail,
      `Order Confirmation #${orderId.slice(0, 8)}`,
      `
        <h1>Thank you for your order!</h1>
        <p>Hi ${order.buyer.display_name},</p>
        <p>Your order has been confirmed and is being prepared by ${order.seller.display_name}.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Fulfillment:</strong> ${fulfillmentType === 'local_pickup' ? 'Local Pickup' : 'Shipping'}</p>
        
        ${order.shipping_address ? `
          <h3>Shipping Address</h3>
          <p>${order.shipping_address.street}<br>
          ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}</p>
        ` : ''}
        
        ${order.pickup_location ? `
          <h3>Pickup Location</h3>
          <p>${order.pickup_location}</p>
        ` : ''}
        
        <p>You'll receive another email when your order ships or is ready for pickup.</p>
        <p>View your order: <a href="https://craftchicagofinds.com/orders">My Orders</a></p>
        
        <p>Best regards,<br>The Craft Local Team</p>
      `
    );

    // Send notification to seller
    await sendEmail(
      sellerEmail,
      `New Order #${orderId.slice(0, 8)}`,
      `
        <h1>You have a new order!</h1>
        <p>Hi ${order.seller.display_name},</p>
        <p>You've received a new order from ${order.buyer.display_name}.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Your Earnings:</strong> $${(total * 0.9).toFixed(2)} (after 10% platform fee)</p>
        <p><strong>Fulfillment:</strong> ${fulfillmentType === 'local_pickup' ? 'Local Pickup' : 'Shipping'}</p>
        
        ${order.shipping_address ? `
          <h3>Shipping Address</h3>
          <p>${order.shipping_address.street}<br>
          ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}</p>
        ` : ''}
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Confirm the order in your dashboard</li>
          <li>${fulfillmentType === 'local_pickup' ? 'Coordinate pickup time with buyer' : 'Ship the order within 3 business days'}</li>
          <li>Update the order status when complete</li>
        </ol>
        
        <p>Manage this order: <a href="https://craftchicagofinds.com/seller/dashboard">Seller Dashboard</a></p>
        
        <p>Best regards,<br>The Craft Local Team</p>
      `
    );

    console.log("Order confirmation emails sent successfully:", orderId);

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending order confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});