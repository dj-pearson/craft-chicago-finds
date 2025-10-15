import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sendEmail = async ({ to, subject, html, from }: { to: string; subject: string; html: string; from: string }) => {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Resend API error: ${res.status}`);
  }
  return data;
};

interface OrderNotificationRequest {
  orderId: string;
  buyerEmail: string;
  sellerEmail: string;
  buyerName: string;
  sellerName: string;
  orderTotal: number;
  orderItems: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  fulfillmentMethod: 'pickup' | 'shipping';
  pickupLocation?: string;
  trackingNumber?: string;
  notificationType: 'order_placed' | 'order_confirmed' | 'order_shipped' | 'order_delivered' | 'order_cancelled';
}

const getEmailContent = (type: string, data: OrderNotificationRequest) => {
  const orderNumber = data.orderId.slice(0, 8).toUpperCase();
  
  const templates: Record<string, { buyer: any, seller: any }> = {
    order_placed: {
      buyer: {
        subject: `Order Confirmation #${orderNumber}`,
        html: `
          <h1>Thank you for your order!</h1>
          <p>Hi ${data.buyerName},</p>
          <p>We've received your order and the seller has been notified.</p>
          
          <h2>Order Details</h2>
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Total:</strong> $${data.orderTotal.toFixed(2)}</p>
          
          <h3>Items:</h3>
          <ul>
            ${data.orderItems.map(item => `
              <li>${item.quantity}x ${item.title} - $${(item.price * item.quantity).toFixed(2)}</li>
            `).join('')}
          </ul>
          
          <p><strong>Fulfillment:</strong> ${data.fulfillmentMethod === 'pickup' ? `Local Pickup at ${data.pickupLocation}` : 'Shipping'}</p>
          
          <p>You'll receive another email when the seller confirms your order.</p>
          
          <p>Best regards,<br>Craft Local Team</p>
        `
      },
      seller: {
        subject: `New Order #${orderNumber}`,
        html: `
          <h1>You have a new order!</h1>
          <p>Hi ${data.sellerName},</p>
          <p>Congratulations! You've received a new order.</p>
          
          <h2>Order Details</h2>
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Customer:</strong> ${data.buyerName}</p>
          <p><strong>Total:</strong> $${data.orderTotal.toFixed(2)}</p>
          
          <h3>Items:</h3>
          <ul>
            ${data.orderItems.map(item => `
              <li>${item.quantity}x ${item.title} - $${(item.price * item.quantity).toFixed(2)}</li>
            `).join('')}
          </ul>
          
          <p><strong>Fulfillment:</strong> ${data.fulfillmentMethod === 'pickup' ? 'Local Pickup' : 'Shipping'}</p>
          
          <p>Please log in to your seller dashboard to confirm the order and prepare for fulfillment.</p>
          
          <p>Best regards,<br>Craft Local Team</p>
        `
      }
    },
    order_confirmed: {
      buyer: {
        subject: `Order #${orderNumber} Confirmed`,
        html: `
          <h1>Your order has been confirmed!</h1>
          <p>Hi ${data.buyerName},</p>
          <p>Great news! The seller has confirmed your order and is preparing it for ${data.fulfillmentMethod === 'pickup' ? 'pickup' : 'shipment'}.</p>
          
          <p><strong>Order #:</strong> ${orderNumber}</p>
          ${data.fulfillmentMethod === 'pickup' ? `<p><strong>Pickup Location:</strong> ${data.pickupLocation}</p>` : ''}
          
          <p>We'll notify you when it's ready.</p>
          
          <p>Best regards,<br>Craft Local Team</p>
        `
      },
      seller: null
    },
    order_shipped: {
      buyer: {
        subject: `Order #${orderNumber} Shipped`,
        html: `
          <h1>Your order is on its way!</h1>
          <p>Hi ${data.buyerName},</p>
          <p>Your order has been shipped!</p>
          
          <p><strong>Order #:</strong> ${orderNumber}</p>
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          
          <p>Your items should arrive soon.</p>
          
          <p>Best regards,<br>Craft Local Team</p>
        `
      },
      seller: null
    },
    order_delivered: {
      buyer: {
        subject: `Order #${orderNumber} Delivered`,
        html: `
          <h1>Your order has been delivered!</h1>
          <p>Hi ${data.buyerName},</p>
          <p>Your order has been delivered. We hope you love your purchase!</p>
          
          <p><strong>Order #:</strong> ${orderNumber}</p>
          
          <p>Please consider leaving a review to help other buyers and support the seller.</p>
          
          <p>Best regards,<br>Craft Local Team</p>
        `
      },
      seller: null
    },
    order_cancelled: {
      buyer: {
        subject: `Order #${orderNumber} Cancelled`,
        html: `
          <h1>Order Cancelled</h1>
          <p>Hi ${data.buyerName},</p>
          <p>Your order has been cancelled.</p>
          
          <p><strong>Order #:</strong> ${orderNumber}</p>
          
          <p>If you didn't request this cancellation, please contact support.</p>
          <p>Any payment will be refunded to your original payment method within 5-7 business days.</p>
          
          <p>Best regards,<br>Craft Local Team</p>
        `
      },
      seller: null
    }
  };

  return templates[type] || templates.order_placed;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderNotificationRequest = await req.json();
    const emailContent = getEmailContent(data.notificationType, data);

    const buyerEmail = await sendEmail({
      from: "Craft Local <orders@craftlocal.co>",
      to: data.buyerEmail,
      subject: emailContent.buyer.subject,
      html: emailContent.buyer.html,
    });

    console.log("Buyer email sent:", buyerEmail);

    // Send email to seller if template exists
    if (emailContent.seller) {
      const sellerEmail = await sendEmail({
        from: "Craft Local <orders@craftlocal.co>",
        to: data.sellerEmail,
        subject: emailContent.seller.subject,
        html: emailContent.seller.html,
      });
      console.log("Seller email sent:", sellerEmail);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
