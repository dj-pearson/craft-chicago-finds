import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const { plan_id, success_url, cancel_url } = await req.json()

    console.log('Creating subscription for user:', user.id, 'plan:', plan_id)

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      throw new Error('Plan not found')
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    let customer_id = null

    // Get or create Stripe customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customer_id = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      
      customer_id = customer.id

      // Update profile with customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customer_id })
        .eq('user_id', user.id)
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
        upgrade: existingSubscription ? 'true' : 'false',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: plan_id,
        },
      },
    })

    console.log('Subscription checkout session created:', session.id)

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating subscription:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})