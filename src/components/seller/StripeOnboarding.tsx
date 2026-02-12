import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, DollarSign, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StripeOnboardingProps {
  onComplete?: () => void;
}

export const StripeOnboarding = ({ onComplete }: StripeOnboardingProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    first_name: profile?.display_name?.split(' ')[0] || '',
    last_name: profile?.display_name?.split(' ')[1] || '',
    business_name: (profile as any)?.business_name || '',
    description: (profile as any)?.seller_description || '',
    website: (profile as any)?.website || ''
  });

  const handleStartOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          business_info: businessInfo,
          return_url: `${window.location.origin}/seller-dashboard?onboarding=complete`,
          refresh_url: `${window.location.origin}/seller-dashboard?onboarding=refresh`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirect to Stripe onboarding
      window.location.href = data.onboarding_url;
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Onboarding failed',
        description: error instanceof Error ? error.message : 'Failed to start onboarding process',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // If user already has Stripe account
  if ((profile as any)?.stripe_account_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Payment Setup Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={(profile as any)?.seller_verified ? "default" : "secondary"}>
                {(profile as any)?.seller_verified ? "Verified" : "Pending Verification"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Your Stripe account is connected and ready to receive payments.
              {!(profile as any)?.seller_verified && " Verification may take 1-2 business days."}
            </p>
            {onComplete && (
              <Button onClick={onComplete}>
                Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Set Up Payments with Stripe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/5 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary">Why Stripe?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Stripe provides secure payment processing, automatic tax handling, 
                and quick payouts. Your financial information is protected and never 
                stored on our servers.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={businessInfo.first_name}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="John"
                autoComplete="given-name"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={businessInfo.last_name}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business_name">Business Name (Optional)</Label>
            <Input
              id="business_name"
              value={businessInfo.business_name}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_name: e.target.value }))}
              placeholder="Your business or shop name"
              autoComplete="organization"
            />
          </div>

          <div>
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={businessInfo.description}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Briefly describe what you sell..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              value={businessInfo.website}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://your-website.com"
            />
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You'll be redirected to Stripe to complete your account setup</li>
            <li>• Provide your tax information and bank account details</li>
            <li>• Stripe will verify your identity (usually takes 1-2 business days)</li>
            <li>• Once verified, you can start selling and receiving payments</li>
          </ul>
        </div>

        <Button 
          onClick={handleStartOnboarding}
          disabled={loading || !businessInfo.first_name || !businessInfo.last_name}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Setting up your account...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Continue with Stripe
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree to Stripe's Terms of Service and will be redirected 
          to their secure platform to complete account setup.
        </p>
      </CardContent>
    </Card>
  );
};