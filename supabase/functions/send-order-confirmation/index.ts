import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { render } from 'npm:@react-email/components@0.0.22';
import { OrderConfirmationBuyer } from './_templates/order-confirmation-buyer.tsx';
import { OrderConfirmationSeller } from './_templates/order-confirmation-seller.tsx';
import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: "Chicago Makers Marketplace <orders@craftlocal.love>",
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

    // Fetch order with all details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        buyer:profiles!buyer_id(display_name, email),
        seller:profiles!seller_id(display_name, email),
        order_items(
          quantity,
          price,
          listing:listings(title)
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Format items for email templates
    const items = order.order_items.map((item: any) => ({
      title: item.listing.title,
      quantity: item.quantity,
      price: item.price,
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shipping = order.shipping_cost || 0;
    const total = order.total_amount || 0;

    // Send buyer confirmation with React Email template
    const buyerEmailHtml = render(OrderConfirmationBuyer({
      buyerName: order.buyer.display_name || 'Customer',
      orderId: orderId.slice(0, 8),
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      items,
      subtotal,
      shipping,
      total,
      sellerName: order.seller.display_name || 'Seller',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      }),
    }));

    await sendEmail(
      order.buyer.email,
      `Order Confirmation #${orderId.slice(0, 8)}`,
      buyerEmailHtml
    );
    console.log('Buyer confirmation email sent');

    // Send seller notification with React Email template
    const platformFee = subtotal * 0.1;
    const payout = subtotal - platformFee;

    const shippingAddress = order.shipping_address 
      ? `${order.shipping_address.street}\n${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}`
      : 'Address not provided';

    const sellerEmailHtml = render(OrderConfirmationSeller({
      sellerName: order.seller.display_name || 'Seller',
      orderId: orderId.slice(0, 8),
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      items,
      subtotal,
      platformFee,
      payout,
      buyerName: order.buyer.display_name || 'Customer',
      shippingAddress,
    }));

    await sendEmail(
      order.seller.email,
      `New Order Received #${orderId.slice(0, 8)}`,
      sellerEmailHtml
    );
    console.log('Seller notification email sent');

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