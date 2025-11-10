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
      from: "Craft Local <orders@craftlocal.net>",
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
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface StatusUpdateRequest {
  orderId: string;
  newStatus: string;
  trackingNumber?: string;
}

const statusMessages: Record<string, {buyer: string, seller: string}> = {
  confirmed: {
    buyer: "Your order has been confirmed and is being prepared.",
    seller: "You've confirmed this order. Don't forget to update when shipped/ready!"
  },
  shipped: {
    buyer: "Great news! Your order has been shipped.",
    seller: "Order marked as shipped. Customer has been notified."
  },
  ready_for_pickup: {
    buyer: "Your order is ready for pickup!",
    seller: "Order marked as ready for pickup. Customer has been notified."
  },
  delivered: {
    buyer: "Your order has been delivered. Hope you love it!",
    seller: "Order marked as delivered. Thank you for being a great seller!"
  },
  completed: {
    buyer: "Your order is complete. Please leave a review!",
    seller: "Order completed. Great job!"
  },
  cancelled: {
    buyer: "Your order has been cancelled. A full refund will be processed.",
    seller: "Order cancelled. Refund has been initiated."
  },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus, trackingNumber }: StatusUpdateRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        buyer:profiles!buyer_id(display_name, email),
        seller:profiles!seller_id(display_name, email)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const messages = statusMessages[newStatus];
    if (!messages) {
      throw new Error("Invalid status");
    }

    // Send update to buyer
    await sendEmail(
      order.buyer.email,
      `Order Update #${orderId.slice(0, 8)}`,
      `
        <h1>Order Status Update</h1>
        <p>Hi ${order.buyer.display_name},</p>
        <p>${messages.buyer}</p>
        
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <p><strong>New Status:</strong> ${newStatus.replace(/_/g, ' ').toUpperCase()}</p>
        
        ${trackingNumber ? `
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        ` : ''}
        
        ${newStatus === 'delivered' || newStatus === 'completed' ? `
          <p>We hope you love your purchase! Please take a moment to leave a review.</p>
          <p><a href="https://craftlocal.net/orders">Leave a Review</a></p>
        ` : ''}
        
        <p>View order details: <a href="https://craftlocal.net/orders">My Orders</a></p>
        
        <p>Best regards,<br>The Craft Local Team</p>
      `
    );

    console.log("Status update email sent successfully:", orderId, newStatus);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending status update:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});