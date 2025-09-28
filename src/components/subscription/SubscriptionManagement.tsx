import { usePlans } from '@/hooks/usePlans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Star, 
  TrendingUp, 
  Eye, 
  BarChart3, 
  Headphones, 
  Palette,
  Calendar,
  CreditCard,
  ArrowUpCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SubscriptionManagement = () => {
  const { 
    currentSubscription, 
    plans, 
    cancelSubscription, 
    subscribeToPlan,
    isFeatureAvailable,
    getRemainingListings,
    loading 
  } = usePlans();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [canceling, setCanceling] = useState(false);

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    setCanceling(true);
    try {
      await cancelSubscription();
      toast({
        title: 'Subscription canceled',
        description: 'Your subscription has been canceled. You can continue using premium features until the end of your billing period.',
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast({
        title: 'Cancellation failed',
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: 'destructive'
      });
    } finally {
      setCanceling(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const checkoutUrl = await subscribeToPlan(planId);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast({
        title: 'Upgrade failed',
        description: 'Failed to start upgrade process',
        variant: 'destructive'
      });
    }
  };

  const remainingListings = getRemainingListings();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSubscription) {
    // Free tier user
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Free Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You're currently on the free plan. Upgrade to unlock premium features and grow your business.
            </p>
            
            {/* Usage Stats */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Listings Used</span>
                  <span>{remainingListings !== null ? `${5 - remainingListings}/5` : 'Unlimited'}</span>
                </div>
                {remainingListings !== null && (
                  <Progress value={((5 - remainingListings) / 5) * 100} className="h-2" />
                )}
              </div>
            </div>

            <Button onClick={() => navigate('/pricing')} className="w-full">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>What you'll get with premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm">Unlimited listings</span>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-sm">Featured placement</span>
              </div>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-primary" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Paid subscription user
  const plan = currentSubscription.plan;
  const nextPlan = plans.find(p => p.price > plan.price);

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {plan.name} Plan
            <Badge variant="success">Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-semibold">${plan.price}/{plan.interval}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="success">{currentSubscription.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next billing</span>
                <span className="text-sm">
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Listings</span>
                <span className="text-sm">
                  {plan.max_listings === null ? 'Unlimited' : plan.max_listings}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Featured</span>
                <span className="text-sm">{plan.featured_listings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Analytics</span>
                <span className="text-sm">
                  {plan.analytics_enabled ? 'Advanced' : 'Basic'}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Status */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Active Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`flex items-center gap-2 ${plan.analytics_enabled ? 'text-success' : 'text-muted-foreground'}`}>
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Analytics</span>
              </div>
              <div className={`flex items-center gap-2 ${plan.priority_support ? 'text-success' : 'text-muted-foreground'}`}>
                <Headphones className="h-4 w-4" />
                <span className="text-sm">Priority Support</span>
              </div>
              <div className={`flex items-center gap-2 ${plan.custom_branding ? 'text-success' : 'text-muted-foreground'}`}>
                <Palette className="h-4 w-4" />
                <span className="text-sm">Custom Branding</span>
              </div>
              <div className={`flex items-center gap-2 ${plan.featured_listings > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                <Eye className="h-4 w-4" />
                <span className="text-sm">Featured Listings</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-4 flex gap-3">
            {nextPlan && (
              <Button 
                onClick={() => handleUpgrade(nextPlan.id)}
                variant="default"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Upgrade to {nextPlan.name}
              </Button>
            )}
            
            <Button 
              onClick={() => navigate('/pricing')}
              variant="outline"
            >
              View All Plans
            </Button>
            
            <Button 
              onClick={handleCancelSubscription}
              disabled={canceling}
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              {canceling ? 'Canceling...' : 'Cancel Subscription'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {remainingListings === null ? '∞' : remainingListings}
              </div>
              <div className="text-sm text-muted-foreground">Listings Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{plan.featured_listings}</div>
              <div className="text-sm text-muted-foreground">Featured Slots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.floor((new Date(currentSubscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-muted-foreground">Days Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <Badge variant="outline">Stripe</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Auto-renewal</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next charge</span>
              <span className="text-sm font-medium">
                ${plan.price} on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};