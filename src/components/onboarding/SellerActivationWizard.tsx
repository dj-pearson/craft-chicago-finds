/**
 * Seller Activation Wizard Component
 * Multi-step wizard for activating seller features
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2,
  Store,
  DollarSign,
  Package,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Truck,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

interface SellerActivationWizardProps {
  open: boolean;
  onComplete: () => void;
}

export const SellerActivationWizard = ({ open, onComplete }: SellerActivationWizardProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [hasStripe, setHasStripe] = useState(false);

  // Form data
  const [shopDescription, setShopDescription] = useState('');
  const [offersShipping, setOffersShipping] = useState(true);
  const [offersLocalPickup, setOffersLocalPickup] = useState(true);
  const [pickupInstructions, setPickupInstructions] = useState('');

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Check if user already has Stripe connected
  useEffect(() => {
    if (profile) {
      const stripeConnected = !!(profile as any)?.stripe_account_id;
      setHasStripe(stripeConnected);
    }
  }, [profile]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStripeConnect = async () => {
    if (!user) return;

    setStripeLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe onboarding in new window
        window.open(data.url, '_blank');
        toast.info('Complete Stripe setup in the new window, then come back here.');

        // Poll for Stripe completion
        const pollInterval = setInterval(async () => {
          await refreshProfile();
          const updated = await supabase
            .from('profiles')
            .select('stripe_account_id')
            .eq('user_id', user.id)
            .single();

          if (updated.data?.stripe_account_id) {
            setHasStripe(true);
            clearInterval(pollInterval);
            toast.success('Stripe account connected successfully!');
          }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      toast.error('Failed to initiate Stripe setup');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Update profile with seller preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio: shopDescription || null,
          seller_setup_completed: true,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Store shipping preferences (you may want to create a seller_preferences table)
      // For now, we'll store in localStorage as a temporary solution
      const sellerPreferences = {
        offersShipping,
        offersLocalPickup,
        pickupInstructions: offersLocalPickup ? pickupInstructions : null,
      };
      localStorage.setItem('sellerPreferences', JSON.stringify(sellerPreferences));

      await refreshProfile();

      toast.success('Seller account activated!');
      onComplete();

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing seller activation:', error);
      toast.error('Failed to complete seller activation');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Welcome screen
      case 2:
        return hasStripe; // Must have Stripe connected
      case 3:
        return shopDescription.trim().length > 0;
      case 4:
        return offersShipping || offersLocalPickup;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" hideClose>
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Store className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">
                Start Selling on Craft Chicago Finds!
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Let's set up your seller account. This will take just a few minutes and will
                allow you to start listing and selling your handmade items.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">Connect Stripe</p>
                  <p className="text-xs text-muted-foreground">Receive payments securely</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">Setup Shop</p>
                  <p className="text-xs text-muted-foreground">Tell buyers about you</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">Start Listing</p>
                  <p className="text-xs text-muted-foreground">Share your creations</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNext} size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Stripe Setup */}
        {step === 2 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <DollarSign className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Connect Your Stripe Account</DialogTitle>
              <DialogDescription className="text-center">
                Stripe processes payments securely and transfers funds directly to your bank account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {hasStripe ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Stripe account connected!</p>
                        <p className="text-sm text-green-700">
                          You're all set to receive payments from customers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-900">Stripe account required</p>
                          <p className="text-sm text-orange-700">
                            You must connect a Stripe account to receive payments and create listings.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Secure payment processing by Stripe</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Automatic transfers to your bank account</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Built-in fraud protection and buyer trust</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Professional receipts and invoicing</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleStripeConnect}
                    disabled={stripeLoading}
                    size="lg"
                    className="w-full"
                  >
                    {stripeLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening Stripe...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Connect Stripe Account
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Shop Profile */}
        {step === 3 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Store className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Tell Us About Your Shop</DialogTitle>
              <DialogDescription className="text-center">
                This will appear on your seller profile and help buyers learn about your work
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="shopDescription">
                  Shop Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="shopDescription"
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
                  placeholder="Tell buyers about your craft, your story, and what makes your items special..."
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {shopDescription.length}/1000 characters
                </p>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> A compelling shop description can increase sales! Include:
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 ml-4 space-y-1 list-disc">
                    <li>What you make and your crafting process</li>
                    <li>Your inspiration and background</li>
                    <li>What makes your items unique</li>
                    <li>Materials and techniques you use</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Fulfillment Options */}
        {step === 4 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <Truck className="h-12 w-12 text-orange-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Fulfillment Options</DialogTitle>
              <DialogDescription className="text-center">
                How will you get your items to buyers?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    offersShipping ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setOffersShipping(!offersShipping)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={offersShipping}
                        onCheckedChange={(checked) => setOffersShipping(!!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold cursor-pointer">
                            Offer Shipping
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ship items to buyers anywhere. You'll set shipping costs per listing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    offersLocalPickup ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setOffersLocalPickup(!offersLocalPickup)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={offersLocalPickup}
                        onCheckedChange={(checked) => setOffersLocalPickup(!!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold cursor-pointer">
                            Offer Local Pickup
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Allow buyers to pick up items locally at no shipping cost
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {offersLocalPickup && (
                <div>
                  <Label htmlFor="pickupInstructions">Pickup Instructions (Optional)</Label>
                  <Textarea
                    id="pickupInstructions"
                    value={pickupInstructions}
                    onChange={(e) => setPickupInstructions(e.target.value)}
                    placeholder="e.g., 'Available for pickup at my studio on weekends, 123 Main St, Chicago IL'"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {pickupInstructions.length}/500 characters
                  </p>
                </div>
              )}

              {!offersShipping && !offersLocalPickup && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <p className="text-sm text-orange-900">
                        You must offer at least one fulfillment method
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleComplete} disabled={!canProceed() || loading} size="lg" className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
