import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sendEmail({ to, subject, html, from }: { to: string; subject: string; html: string; from: string }) {
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
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  listing_id: string;
  quantity: number;
  title?: string;
  price?: number;
  image?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get carts that haven't been updated in 24 hours and haven't received a reminder
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: cartsError } = await supabaseClient
      .from('carts')
      .select('user_id, items, updated_at')
      .lt('updated_at', twentyFourHoursAgo)
      .is('reminder_sent_at', null)
      .not('items', 'eq', '[]');

    if (cartsError) throw cartsError;

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts`);

    let emailsSent = 0;

    for (const cart of abandonedCarts || []) {
      try {
        // Get user email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, display_name')
          .eq('user_id', cart.user_id)
          .single();

        if (!profile?.email) continue;

        const items: CartItem[] = cart.items || [];
        
        // Get listing details
        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const { data: listing } = await supabaseClient
              .from('listings')
              .select('title, price, images')
              .eq('id', item.listing_id)
              .single();

            return {
              ...item,
              title: listing?.title || 'Unknown Item',
              price: listing?.price || 0,
              image: listing?.images?.[0] || ''
            };
          })
        );

        const totalValue = itemsWithDetails.reduce(
          (sum, item) => sum + ((item.price || 0) * item.quantity), 
          0
        );

        // Send reminder email
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4A90E2;">You left items in your cart!</h1>
            <p>Hi ${profile.display_name || 'there'},</p>
            <p>We noticed you left some amazing handmade items in your cart. They're still waiting for you!</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Your Cart (${items.length} ${items.length === 1 ? 'item' : 'items'})</h2>
              ${itemsWithDetails.map(item => `
                <div style="display: flex; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
                  ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">` : ''}
                  <div>
                    <strong>${item.title}</strong><br>
                    <span style="color: #666;">Quantity: ${item.quantity}</span><br>
                    <span style="color: #4A90E2; font-weight: bold;">$${((item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
              
              <div style="text-align: right; padding-top: 15px; border-top: 2px solid #4A90E2;">
                <strong style="font-size: 18px;">Total: $${totalValue.toFixed(2)}</strong>
              </div>
            </div>
            
            <p>These unique, handcrafted items won't last forever. Complete your purchase now to support local makers!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}/cart" 
                 style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Complete Your Purchase
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you're not interested anymore, you can remove these items from your cart anytime.
            </p>
            
            <p>Best regards,<br>The Craft Local Team</p>
          </div>
        `;

        await sendEmail({
          from: "Craft Local <noreply@craftlocal.co>",
          to: profile.email,
          subject: "You left items in your cart 🛒",
          html: emailHtml,
        });

        // Mark reminder as sent
        await supabaseClient
          .from('carts')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('user_id', cart.user_id);

        emailsSent++;
        console.log(`Sent cart reminder to ${profile.email}`);
      } catch (itemError) {
        console.error(`Error processing cart for user ${cart.user_id}:`, itemError);
        // Continue with next cart even if one fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cartsProcessed: abandonedCarts?.length || 0,
        emailsSent 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-abandoned-cart-reminder:", error);
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
