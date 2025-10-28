import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { time_period = '30d' } = await req.json();

    console.log('ChatGPT seller dashboard request:', user.id, time_period);

    // Calculate date range
    const daysBack = parseInt(time_period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get seller profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_seller) {
      throw new Error('User is not a seller');
    }

    // Get orders stats
    const { data: orders } = await supabaseClient
      .from('orders')
      .select('total_amount, status, created_at')
      .eq('seller_id', user.id)
      .gte('created_at', startDate.toISOString());

    const totalSales = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const salesCount = orders?.filter(o => o.status === 'delivered').length || 0;
    const pendingOrders = orders?.filter(o => ['pending', 'processing'].includes(o.status)).length || 0;

    // Get active listings count
    const { data: listings, count: listingsCount } = await supabaseClient
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'active');

    // Get average rating
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select('rating')
      .eq('seller_id', user.id);

    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const dashboardData = {
      total_sales: totalSales,
      sales_count: salesCount,
      pending_orders: pendingOrders,
      active_listings: listingsCount || 0,
      average_rating: avgRating.toFixed(1),
      time_period: time_period,
      seller_name: profile.display_name
    };

    // Generate simple widget HTML
    const widgetHtml = `
<div style="font-family: system-ui; padding: 20px; background: #f9fafb; border-radius: 8px; max-width: 600px;">
  <h2 style="margin: 0 0 16px 0; color: #111;">Seller Dashboard (${time_period})</h2>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
    <div style="background: white; padding: 16px; border-radius: 6px;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981;">$${totalSales.toFixed(2)}</div>
      <div style="color: #6b7280; font-size: 14px;">Total Sales</div>
    </div>
    <div style="background: white; padding: 16px; border-radius: 6px;">
      <div style="font-size: 24px; font-weight: bold;">${salesCount}</div>
      <div style="color: #6b7280; font-size: 14px;">Completed Orders</div>
    </div>
    <div style="background: white; padding: 16px; border-radius: 6px;">
      <div style="font-size: 24px; font-weight: bold;">${pendingOrders}</div>
      <div style="color: #6b7280; font-size: 14px;">Pending Orders</div>
    </div>
    <div style="background: white; padding: 16px; border-radius: 6px;">
      <div style="font-size: 24px; font-weight: bold;">${listingsCount || 0}</div>
      <div style="color: #6b7280; font-size: 14px;">Active Listings</div>
    </div>
  </div>
  <div style="margin-top: 16px; background: white; padding: 16px; border-radius: 6px;">
    <div style="font-size: 18px; font-weight: bold;">⭐ ${avgRating.toFixed(1)}</div>
    <div style="color: #6b7280; font-size: 14px;">Average Rating (${reviews?.length || 0} reviews)</div>
  </div>
</div>
    `;

    return new Response(JSON.stringify({
      ...dashboardData,
      widget: widgetHtml
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatgpt-seller-dashboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: errorMessage === 'Unauthorized' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
