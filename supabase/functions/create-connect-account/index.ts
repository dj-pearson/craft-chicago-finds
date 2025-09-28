import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    const { business_info, return_url, refresh_url } = await req.json()

    console.log('Creating Stripe Connect account for user:', user.id)

    // Get user profile for business information
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      business_type: 'individual',
      individual: {
        email: user.email,
        first_name: business_info?.first_name || profile?.display_name?.split(' ')[0] || '',
        last_name: business_info?.last_name || profile?.display_name?.split(' ')[1] || '',
      },
      business_profile: {
        name: business_info?.business_name || profile?.business_name || profile?.display_name,
        product_description: business_info?.description || profile?.seller_description || 'Handmade goods and crafts',
        support_email: user.email,
        url: business_info?.website || profile?.website,
      },
      metadata: {
        user_id: user.id,
      }
    })

    console.log('Stripe account created:', account.id)

    // Update user profile with Stripe account ID
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        is_seller: true
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw updateError
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      return_url: return_url,
      refresh_url: refresh_url,
      type: 'account_onboarding',
    })

    console.log('Account link created for onboarding')

    return new Response(
      JSON.stringify({ 
        account_id: account.id,
        onboarding_url: accountLink.url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating Connect account:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})