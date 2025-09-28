import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  prompt: string;
  generation_type: 'social_post' | 'campaign_content' | 'template' | 'test' | 'other';
  context?: any;
  override_settings?: {
    model_name?: string;
    max_tokens?: number;
    temperature?: number;
    system_prompt?: string;
  };
}

interface AISettings {
  model_name: string;
  model_provider: string;
  api_endpoint: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user has admin or moderator permissions
    const { data: hasPermission } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    const { data: isCityModerator } = await supabaseClient.rpc(
      "is_city_moderator",
      {
        _user_id: user.id,
        _city_id: null,
      }
    );

    if (!hasPermission && !isCityModerator) {
      throw new Error("Insufficient permissions");
    }

    const requestData: AIRequest = await req.json();
    const { prompt, generation_type, context, override_settings } = requestData;

    console.log("AI content generation request:", {
      user_id: user.id,
      generation_type,
      prompt_length: prompt.length,
    });

    // Get AI settings from database
    const { data: aiSettings, error: settingsError } = await supabaseClient
      .from("ai_settings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !aiSettings) {
      throw new Error("No active AI settings found");
    }

    // Merge with override settings if provided
    const finalSettings: AISettings = {
      model_name: override_settings?.model_name || aiSettings.model_name,
      model_provider: aiSettings.model_provider,
      api_endpoint: aiSettings.api_endpoint,
      max_tokens: override_settings?.max_tokens || aiSettings.max_tokens,
      temperature: override_settings?.temperature || aiSettings.temperature,
      system_prompt: override_settings?.system_prompt || aiSettings.system_prompt,
    };

    // Get Claude API key from Supabase secrets
    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!claudeApiKey) {
      throw new Error("Claude API key not configured");
    }

    // Prepare the request to Claude API
    const claudeRequest = {
      model: finalSettings.model_name,
      max_tokens: finalSettings.max_tokens,
      temperature: finalSettings.temperature,
      system: finalSettings.system_prompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    console.log("Calling Claude API with model:", finalSettings.model_name);

    // Call Claude API
    const claudeResponse = await fetch(finalSettings.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": claudeApiKey, // Using X-API-Key instead of Bearer
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(claudeRequest),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeResult = await claudeResponse.json();
    const generatedContent = claudeResult.content?.[0]?.text || "";
    const tokensUsed = claudeResult.usage?.output_tokens || 0;

    console.log("Claude API response received:", {
      tokens_used: tokensUsed,
      content_length: generatedContent.length,
    });

    // Log the generation
    const { error: logError } = await supabaseClient
      .from("ai_generation_logs")
      .insert({
        user_id: user.id,
        model_used: finalSettings.model_name,
        prompt,
        response: generatedContent,
        tokens_used: tokensUsed,
        success: true,
        generation_type,
        metadata: {
          context,
          settings_used: finalSettings,
          api_response: {
            model: claudeResult.model,
            usage: claudeResult.usage,
          },
        },
      });

    if (logError) {
      console.error("Error logging AI generation:", logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        tokens_used: tokensUsed,
        model_used: finalSettings.model_name,
        generation_type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in AI content generation:", error);

    // Try to log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: req.headers.get("Authorization")! },
          },
        }
      );

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        await supabaseClient.from("ai_generation_logs").insert({
          user_id: user.id,
          model_used: "unknown",
          prompt: "Error occurred before processing",
          response: null,
          tokens_used: 0,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error",
          generation_type: "other",
          metadata: { error: true },
        });
      }
    } catch (logError) {
      console.error("Error logging AI generation error:", logError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
