import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the current user with anon key first to verify auth
    const supabaseAuth = createClient(
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
    } = await supabaseAuth.auth.getUser();

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
        _city_id: null, // Will check all cities for now
      }
    );

    if (!hasPermission && !isCityModerator) {
      throw new Error("Insufficient permissions");
    }

    const {
      listing_id,
      action, // 'approve', 'reject', 'flag', 'remove'
      reason,
      notes,
      city_id,
    } = await req.json();

    console.log("Moderating listing:", {
      listing_id,
      action,
      moderator_id: user.id,
    });

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select(
        `
        *,
        profiles!listings_seller_id_fkey(display_name, email)
      `
      )
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found");
    }

    // If user is city moderator, verify they can moderate this city's listings
    if (!hasPermission && isCityModerator) {
      const { data: canModerate } = await supabaseClient.rpc(
        "is_city_moderator",
        {
          _user_id: user.id,
          _city_id: listing.city_id,
        }
      );

      if (!canModerate) {
        throw new Error("Cannot moderate listings from this city");
      }
    }

    let newStatus = listing.status;
    let moderatedAt = new Date().toISOString();

    // Determine new status based on action
    switch (action) {
      case "approve":
        newStatus = "active";
        break;
      case "reject":
        newStatus = "rejected";
        break;
      case "flag":
        newStatus = "flagged";
        break;
      case "remove":
        newStatus = "removed";
        break;
      default:
        throw new Error("Invalid moderation action");
    }

    // Update listing status
    const { error: updateError } = await supabaseClient
      .from("listings")
      .update({
        status: newStatus,
        moderated_at: moderatedAt,
        moderated_by: user.id,
        moderation_notes: notes,
      })
      .eq("id", listing_id);

    if (updateError) {
      console.error("Error updating listing:", updateError);
      throw updateError;
    }

    // Log moderation action
    const { error: logError } = await supabaseClient
      .from("moderation_logs")
      .insert({
        listing_id,
        moderator_id: user.id,
        action,
        reason,
        notes,
        previous_status: listing.status,
        new_status: newStatus,
      });

    if (logError) {
      console.error("Error logging moderation action:", logError);
      // Don't fail the operation if logging fails
    }

    // Send notification to seller
    let notificationTitle = "";
    let notificationContent = "";

    switch (action) {
      case "approve":
        notificationTitle = "Listing Approved";
        notificationContent = `Your listing "${listing.title}" has been approved and is now live.`;
        break;
      case "reject":
        notificationTitle = "Listing Needs Changes";
        notificationContent = `Your listing "${
          listing.title
        }" needs some changes before it can go live. ${reason || ""}`;
        break;
      case "flag":
        notificationTitle = "Listing Flagged for Review";
        notificationContent = `Your listing "${
          listing.title
        }" has been flagged for review. ${reason || ""}`;
        break;
      case "remove":
        notificationTitle = "Listing Removed";
        notificationContent = `Your listing "${
          listing.title
        }" has been removed. ${reason || ""}`;
        break;
    }

    // Send notification to seller
    try {
      await supabaseClient.functions.invoke("send-notification-email", {
        body: {
          user_id: listing.seller_id,
          type: "listing_moderated",
          title: notificationTitle,
          content: notificationContent,
          action_url: `/dashboard/listing/${listing_id}/edit`,
          related_id: listing_id,
          sender_id: user.id,
          metadata: {
            action,
            reason,
            moderator_notes: notes,
          },
        },
      });
      console.log("Seller notification sent");
    } catch (notificationError) {
      console.error("Error sending seller notification:", notificationError);
      // Don't fail the operation if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        listing_id,
        action,
        new_status: newStatus,
        message: `Listing ${action}ed successfully`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error moderating listing:", error);
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
