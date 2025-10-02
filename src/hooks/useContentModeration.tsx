import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { moderateListingContent, checkIntellectualProperty } from "@/lib/content-moderation";
import type { ModerationResult } from "@/lib/content-moderation";

export const useContentModeration = () => {
  const [moderating, setModerating] = useState(false);

  const moderateListing = async (
    listingId: string,
    sellerId: string,
    title: string,
    description: string,
    tags: string[] = [],
    category?: string
  ): Promise<{ approved: boolean; result: ModerationResult }> => {
    setModerating(true);

    try {
      // Run content moderation checks
      const moderationResult = moderateListingContent(title, description, tags, category);
      const ipCheck = checkIntellectualProperty(title, description);

      // Combine results
      if (ipCheck.flagged) {
        moderationResult.flagged = true;
        moderationResult.reasons.push(...ipCheck.reasons);
        moderationResult.requiresManualReview = true;
      }

      // If flagged, add to moderation queue
      if (moderationResult.flagged) {
        await supabase.from("moderation_queue").insert({
          content_type: "listing",
          content_id: listingId,
          seller_id: sellerId,
          status: "pending",
          priority: moderationResult.severity === 'high' || moderationResult.severity === 'critical' 
            ? 'urgent' 
            : moderationResult.severity === 'medium' 
            ? 'high' 
            : 'normal',
          auto_flagged: true,
          flag_reasons: moderationResult.reasons,
          confidence_score: moderationResult.confidence,
        });

        // Auto-reject high severity items
        if (moderationResult.severity === 'high' && moderationResult.confidence >= 60) {
          await supabase
            .from("listings")
            .update({ 
              status: "rejected",
              moderation_notes: `Auto-rejected: ${moderationResult.reasons.join('; ')}`
            })
            .eq("id", listingId);

          return { approved: false, result: moderationResult };
        }

        // Pending review for others
        await supabase
          .from("listings")
          .update({ status: "pending_review" })
          .eq("id", listingId);

        return { approved: false, result: moderationResult };
      }

      // Approve if no flags
      return { approved: true, result: moderationResult };
    } catch (error) {
      console.error("Moderation error:", error);
      // On error, default to requiring manual review
      return { 
        approved: false, 
        result: {
          flagged: true,
          reasons: ["Error during automated moderation - requires manual review"],
          severity: 'medium',
          confidence: 100,
          requiresManualReview: true
        }
      };
    } finally {
      setModerating(false);
    }
  };

  return {
    moderateListing,
    moderating
  };
};
