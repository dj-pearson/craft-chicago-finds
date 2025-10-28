import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

    const buyerName = order.buyer.display_name || 'Customer';
    const sellerName = order.seller.display_name || 'Seller';
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });

    // Build buyer email HTML
    const buyerEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #10b981; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">Order Confirmed! 🎉</h1>
            </div>
            
            <div style="padding: 32px 40px;">
              <p style="font-size: 18px; font-weight: 600; color: #1a202c; margin: 0 0 16px;">Hi ${buyerName},</p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Thank you for your order! We've received your order and the maker is preparing it now.
              </p>
              
              <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Order Number</p>
                  <p style="font-size: 16px; color: #1a202c; font-weight: 600; margin: 0;">#${orderId.slice(0, 8)}</p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Order Date</p>
                  <p style="font-size: 16px; color: #1a202c; font-weight: 600; margin: 0;">${orderDate}</p>
                </div>
              </div>
              
              <h2 style="font-size: 20px; font-weight: 600; color: #1a202c; margin: 24px 0 16px;">Order Items</h2>
              ${items.map((item: any) => `
                <div style="margin: 12px 0; display: flex; justify-content: space-between;">
                  <div>
                    <p style="font-size: 16px; color: #1a202c; font-weight: 500; margin: 0;">${item.title}</p>
                    <p style="font-size: 14px; color: #718096; margin: 4px 0 0;">Qty: ${item.quantity}</p>
                  </div>
                  <p style="font-size: 16px; color: #1a202c; font-weight: 600; margin: 0;">$${item.price.toFixed(2)}</p>
                </div>
              `).join('')}
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
              
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <p style="font-size: 16px; color: #4a5568; margin: 0;">Subtotal</p>
                <p style="font-size: 16px; color: #1a202c; margin: 0;">$${subtotal.toFixed(2)}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <p style="font-size: 16px; color: #4a5568; margin: 0;">Shipping</p>
                <p style="font-size: 16px; color: #1a202c; margin: 0;">$${shipping.toFixed(2)}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <p style="font-size: 18px; color: #1a202c; font-weight: 600; margin: 0;">Total</p>
                <p style="font-size: 18px; color: #10b981; font-weight: bold; margin: 0;">$${total.toFixed(2)}</p>
              </div>
              
              <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #4a5568; font-size: 16px; margin: 0 0 8px;"><strong>Maker:</strong> ${sellerName}</p>
                <p style="color: #4a5568; font-size: 16px; margin: 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://craftlocal.love/orders?order=${orderId}" 
                   style="background-color: #10b981; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px;">
                  Track Your Order
                </a>
              </div>
            </div>
            
            <div style="background-color: #f7fafc; border-radius: 0 0 8px 8px; padding: 24px 40px; text-align: center;">
              <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0 0 8px;">
                Questions? Contact the maker directly through your <a href="https://craftlocal.love/orders" style="color: #10b981; text-decoration: underline;">order page</a>
              </p>
              <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0;">
                Chicago Makers Marketplace - Supporting Local Artisans
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      order.buyer.email,
      `Order Confirmation #${orderId.slice(0, 8)}`,
      buyerEmailHtml
    );
    console.log('Buyer confirmation email sent');

    // Build seller email HTML
    const platformFee = subtotal * 0.1;
    const payout = subtotal - platformFee;

    const shippingAddress = order.shipping_address 
      ? `${order.shipping_address.street}<br>${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}`
      : 'Address not provided';

    const sellerEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #8b5cf6; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">New Order Received! 📦</h1>
            </div>
            
            <div style="padding: 32px 40px;">
              <p style="font-size: 18px; font-weight: 600; color: #1a202c; margin: 0 0 16px;">Hi ${sellerName},</p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Great news! You've received a new order. Please prepare the items for shipment.
              </p>
              
              <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Order Number</p>
                  <p style="font-size: 16px; color: #1a202c; font-weight: 600; margin: 0;">#${orderId.slice(0, 8)}</p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Order Date</p>
                  <p style="font-size: 16px; color: #1a202c; font-weight: 600; margin: 0;">${orderDate}</p>
                </div>
              </div>
              
              <h2 style="font-size: 20px; font-weight: 600; color: #1a202c; margin: 24px 0 16px;">Order Items</h2>
              ${items.map((item: any) => `
                <div style="margin: 12px 0; display: flex; justify-content: space-between;">
                  <div>
                    <p style="font-size: 16px; color: #1a202c; font-weight: 500; margin: 0;">${item.title}</p>
                    <p style="font-size: 14px; color: #718096; margin: 4px 0 0;">Qty: ${item.quantity}</p>
                  </div>
                  <p style="font-size: 16px; color: #1a202c; font-weight: 600; margin: 0;">$${item.price.toFixed(2)}</p>
                </div>
              `).join('')}
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
              
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <p style="font-size: 16px; color: #4a5568; margin: 0;">Subtotal</p>
                <p style="font-size: 16px; color: #1a202c; margin: 0;">$${subtotal.toFixed(2)}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <p style="font-size: 16px; color: #4a5568; margin: 0;">Platform Fee (10%)</p>
                <p style="font-size: 16px; color: #1a202c; margin: 0;">-$${platformFee.toFixed(2)}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <p style="font-size: 18px; color: #1a202c; font-weight: 600; margin: 0;">Your Payout</p>
                <p style="font-size: 18px; color: #8b5cf6; font-weight: bold; margin: 0;">$${payout.toFixed(2)}</p>
              </div>
              
              <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="font-size: 20px; font-weight: 600; color: #1a202c; margin: 0 0 16px;">Buyer Information</h2>
                <p style="color: #4a5568; font-size: 16px; margin: 0 0 16px;"><strong>Name:</strong> ${buyerName}</p>
                <p style="color: #4a5568; font-size: 16px; margin: 0;"><strong>Shipping Address:</strong><br>${shippingAddress}</p>
              </div>
              
              <div style="border-left: 4px solid #8b5cf6; padding-left: 20px; margin: 24px 0;">
                <p style="color: #4a5568; font-size: 16px; margin: 0 0 8px;"><strong>Next Steps:</strong></p>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0;">
                  1. Prepare the items for shipment<br>
                  2. Print the shipping label from your dashboard<br>
                  3. Update the order status when shipped
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://craftlocal.love/seller-dashboard?order=${orderId}" 
                   style="background-color: #8b5cf6; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px;">
                  Manage Order
                </a>
              </div>
            </div>
            
            <div style="background-color: #f7fafc; border-radius: 0 0 8px 8px; padding: 24px 40px; text-align: center;">
              <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0 0 8px;">
                Need help? Visit our <a href="https://craftlocal.love/seller-standards" style="color: #8b5cf6; text-decoration: underline;">Seller Standards</a>
              </p>
              <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0;">
                Chicago Makers Marketplace - Supporting Local Artisans
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

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