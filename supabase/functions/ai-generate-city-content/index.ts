import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  cityName: string;
  state: string;
  contentType: 'description' | 'categories' | 'tagline' | 'all';
  existingCategories?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc(
      'is_admin',
      { _user_id: user.id }
    );

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: GenerateRequest = await req.json();
    const { cityName, state, contentType } = requestData;

    console.log('Generating AI content for:', cityName, state, contentType);

    // Get AI settings from database
    const { data: aiSettings, error: settingsError } = await supabaseClient
      .from('ai_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch AI settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt based on content type
    let prompt = '';
    const systemPrompt = aiSettings.system_prompt || 
      'You are a creative content writer specializing in local marketplaces and artisan communities.';

    switch (contentType) {
      case 'description':
        prompt = `Write an engaging, warm description (2-3 sentences) for a new local artisan marketplace launching in ${cityName}, ${state}. 
        
Highlight:
- The city's unique maker culture and creative community
- Local craftsmanship and handmade goods
- Community connection and supporting local artisans

Keep it authentic, inspiring, and focused on the local community. No generic corporate language.`;
        break;

      case 'tagline':
        prompt = `Create a short, memorable tagline (5-8 words) for a local artisan marketplace in ${cityName}, ${state}. 
        
The tagline should:
- Capture the spirit of local craftsmanship
- Be unique to ${cityName}
- Feel warm and community-oriented
- Be catchy and easy to remember

Just return the tagline, nothing else.`;
        break;

      case 'categories':
        prompt = `Generate creative, locally-relevant category descriptions for an artisan marketplace in ${cityName}, ${state}.

For each of these categories, write a brief description (1 sentence):
${requestData.existingCategories?.join('\n') || '- Jewelry & Accessories\n- Home & Garden\n- Art & Collectibles\n- Clothing\n- Food & Beverages\n- Bath & Beauty'}

Format as JSON array:
[
  {"name": "Category Name", "description": "Description here"},
  ...
]

Make descriptions specific to ${cityName} when possible (reference local culture, aesthetics, or characteristics).`;
        break;

      case 'all':
        prompt = `Generate complete content for launching a local artisan marketplace in ${cityName}, ${state}.

Provide:
1. A marketplace description (2-3 sentences highlighting local maker culture)
2. A catchy tagline (5-8 words)
3. Descriptions for these categories (1 sentence each):
   - Jewelry & Accessories
   - Home & Garden
   - Art & Collectibles
   - Clothing
   - Food & Beverages
   - Bath & Beauty

Format as JSON:
{
  "description": "...",
  "tagline": "...",
  "categories": [
    {"name": "...", "description": "..."},
    ...
  ]
}

Make all content authentic to ${cityName} and avoid generic corporate language.`;
        break;
    }

    // Call Lovable AI with configured settings
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiSettings.model_name || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: parseFloat(aiSettings.temperature?.toString() || '0.7'),
        max_tokens: aiSettings.max_tokens || 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0]?.message?.content;

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the generation
    await supabaseClient
      .from('ai_generation_logs')
      .insert({
        user_id: user.id,
        generation_type: `city_${contentType}`,
        model_used: aiSettings.model_name,
        tokens_used: aiData.usage?.total_tokens,
        prompt: prompt,
        response: generatedContent,
        success: true,
        metadata: {
          city_name: cityName,
          state: state
        }
      });

    console.log('AI content generated successfully');

    // Parse JSON responses for structured content
    let parsedContent;
    if (contentType === 'categories' || contentType === 'all') {
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                         generatedContent.match(/```\n([\s\S]*?)\n```/) ||
                         [null, generatedContent];
        parsedContent = JSON.parse(jsonMatch[1] || generatedContent);
      } catch (e) {
        // If parsing fails, return as raw text
        parsedContent = generatedContent;
      }
    } else {
      parsedContent = generatedContent.trim();
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: parsedContent,
        model_used: aiSettings.model_name
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
