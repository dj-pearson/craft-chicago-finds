import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReportListingButtonProps {
  listingId: string;
  sellerId: string;
}

const REPORT_REASONS = [
  { value: "prohibited_item", label: "Prohibited Item" },
  { value: "counterfeit", label: "Counterfeit or Fake Product" },
  { value: "misleading", label: "Misleading Description" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "intellectual_property", label: "Copyright/Trademark Violation" },
  { value: "other", label: "Other Concern" },
];

export const ReportListingButton = ({ listingId, sellerId }: ReportListingButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Add to moderation queue
      const { error } = await supabase
        .from("moderation_queue")
        .insert({
          content_type: "listing",
          content_id: listingId,
          seller_id: sellerId,
          status: "pending",
          priority: reason === "safety_concern" || reason === "prohibited_item" ? "high" : "normal",
          auto_flagged: false,
          flag_reasons: [reason, details].filter(Boolean),
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our marketplace safe. We'll review this listing shortly.",
      });

      setOpen(false);
      setReason("");
      setDetails("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Report Suspicious Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report This Listing</DialogTitle>
          <DialogDescription>
            Help us maintain a safe marketplace by reporting suspicious or inappropriate listings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-3 block">Reason for Report *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional information that might help our review..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="flex-1"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
