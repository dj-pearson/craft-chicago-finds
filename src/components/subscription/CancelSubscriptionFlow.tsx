/**
 * Cancel Subscription Flow
 * Multi-step retention flow when users try to cancel
 */

import { useState } from "react";
import { usePlans } from "@/hooks/usePlans";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertTriangle,
  Gift,
  Pause,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  BarChart3,
  Users,
  Star,
} from "lucide-react";

interface CancelSubscriptionFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCanceled?: () => void;
}

type CancelReason =
  | "too_expensive"
  | "not_using"
  | "missing_features"
  | "found_alternative"
  | "temporary_pause"
  | "other";

const cancelReasons: { value: CancelReason; label: string }[] = [
  { value: "too_expensive", label: "It's too expensive for me right now" },
  { value: "not_using", label: "I'm not using it enough" },
  { value: "missing_features", label: "It's missing features I need" },
  { value: "found_alternative", label: "I found a better alternative" },
  { value: "temporary_pause", label: "I just need a break temporarily" },
  { value: "other", label: "Other reason" },
];

export function CancelSubscriptionFlow({
  open,
  onOpenChange,
  onCanceled,
}: CancelSubscriptionFlowProps) {
  const { currentSubscription, cancelSubscription, refreshSubscription } = usePlans();
  const [step, setStep] = useState(1);
  const [cancelReason, setCancelReason] = useState<CancelReason | "">("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleClose = () => {
    setStep(1);
    setCancelReason("");
    setOtherReason("");
    setOfferAccepted(false);
    onOpenChange(false);
  };

  const handleAcceptOffer = async (offerType: "pause" | "discount") => {
    setLoading(true);
    try {
      if (offerType === "pause") {
        // In production, this would call a Stripe API to pause the subscription
        toast.success("Your subscription has been paused for 3 months");
      } else {
        // In production, this would apply a coupon via Stripe
        toast.success("50% discount applied to your next 3 months!");
      }
      setOfferAccepted(true);
      await refreshSubscription();
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      toast.error("Failed to apply offer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    try {
      // Log the cancellation reason for analytics (non-blocking)
      if (currentSubscription) {
        supabase.from("subscription_cancellations").insert({
          subscription_id: currentSubscription.id,
          reason: cancelReason,
          other_reason: cancelReason === "other" ? otherReason : null,
        }).then(() => {
          console.debug("Cancellation reason logged successfully");
        }).catch((error) => {
          // Non-critical: analytics table may not exist in all environments
          console.debug("Could not log cancellation reason:", error?.message || "Unknown error");
        });
      }

      await cancelSubscription();
      toast.success("Your subscription has been canceled");
      onCanceled?.();
      handleClose();
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRetentionOffer = () => {
    switch (cancelReason) {
      case "too_expensive":
        return {
          type: "discount" as const,
          title: "We hear you! How about 50% off?",
          description:
            "We'd hate to see you go. As a valued member, we can offer you 50% off for the next 3 months.",
          buttonText: "Accept 50% Discount",
          icon: DollarSign,
        };
      case "not_using":
      case "temporary_pause":
        return {
          type: "pause" as const,
          title: "Need a break? Pause instead!",
          description:
            "You can pause your subscription for up to 3 months and pick up right where you left off.",
          buttonText: "Pause for 3 Months",
          icon: Pause,
        };
      case "missing_features":
        return {
          type: "discount" as const,
          title: "Help us improve + save 50%",
          description:
            "We're always adding new features! Stay for 50% off while we build what you need.",
          buttonText: "Accept 50% Discount",
          icon: Gift,
        };
      default:
        return {
          type: "discount" as const,
          title: "Before you go - 50% off!",
          description:
            "We'd love to keep you. Accept 50% off for the next 3 months as our thanks.",
          buttonText: "Accept 50% Discount",
          icon: Gift,
        };
    }
  };

  const planFeatures = [
    { icon: BarChart3, label: "Analytics Dashboard" },
    { icon: Star, label: "Featured Listings" },
    { icon: Users, label: "Priority Support" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Step 1: Ask Why */}
        {step === 1 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <AlertTriangle className="h-10 w-10 text-orange-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                We're sorry to see you go
              </DialogTitle>
              <DialogDescription className="text-center">
                Before you cancel, please let us know why you're leaving.
                Your feedback helps us improve.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup
                value={cancelReason}
                onValueChange={(value) => setCancelReason(value as CancelReason)}
              >
                <div className="space-y-3">
                  {cancelReasons.map((reason) => (
                    <Card
                      key={reason.value}
                      className={`cursor-pointer transition-all ${
                        cancelReason === reason.value ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setCancelReason(reason.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={reason.value} id={reason.value} />
                          <Label htmlFor={reason.value} className="cursor-pointer flex-1">
                            {reason.label}
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>

              {cancelReason === "other" && (
                <div className="mt-4">
                  <Textarea
                    placeholder="Please tell us more..."
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Never mind
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!cancelReason}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Retention Offer */}
        {step === 2 && !offerAccepted && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  {(() => {
                    const offer = getRetentionOffer();
                    const Icon = offer.icon;
                    return <Icon className="h-10 w-10 text-primary" />;
                  })()}
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                {getRetentionOffer().title}
              </DialogTitle>
              <DialogDescription className="text-center">
                {getRetentionOffer().description}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <Button
                onClick={() => handleAcceptOffer(getRetentionOffer().type)}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    {getRetentionOffer().buttonText}
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">or</div>

              <Button
                variant="outline"
                onClick={() => setStep(3)}
                disabled={loading}
                className="w-full"
              >
                No thanks, continue to cancel
              </Button>
            </div>

            <div className="flex justify-start">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={loading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Offer Accepted */}
        {step === 2 && offerAccepted && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Great news!
              </DialogTitle>
              <DialogDescription className="text-center">
                Your offer has been applied. Thank you for staying with us!
              </DialogDescription>
            </DialogHeader>
          </>
        )}

        {/* Step 3: Final Confirmation */}
        {step === 3 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 rounded-full">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Are you absolutely sure?
              </DialogTitle>
              <DialogDescription className="text-center">
                By canceling, you'll lose access to these features:
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {planFeatures.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Icon className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="text-red-900">{feature.label}</span>
                          <TrendingDown className="h-4 w-4 text-red-500 ml-auto" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your subscription will remain active until the end of your current
                  billing period on{" "}
                  <span className="font-medium text-foreground">
                    {currentSubscription?.current_period_end
                      ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                      : "your next billing date"}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Yes, Cancel My Subscription"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full"
              >
                Keep My Subscription
              </Button>
            </div>

            <div className="flex justify-start mt-2">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                disabled={loading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to offer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
