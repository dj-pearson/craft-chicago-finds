import { useState } from 'react';
import { usePlans } from '@/hooks/usePlans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Star, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FAQSection, etsyAlternativeFAQs } from '@/components/seo/FAQSection';

export const PricingPage = () => {
  const { plans, currentSubscription, subscribeToPlan } = usePlans();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const checkoutUrl = await subscribeToPlan(planId);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription failed',
        description: error instanceof Error ? error.message : 'Failed to start subscription',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
      case 'basic':
        return <Star className="h-6 w-6" />;
      case 'pro':
      case 'professional':
        return <Zap className="h-6 w-6" />;
      case 'premium':
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const getButtonText = (plan: any) => {
    if (isCurrentPlan(plan.id)) return 'Current Plan';
    if (plan.price === 0) return 'Get Started';
    return 'Upgrade Now';
  };

  const getButtonVariant = (plan: any) => {
    if (isCurrentPlan(plan.id)) return 'outline';
    if (plan.popular) return 'default';
    return 'outline';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features to grow your business and reach more customers in Chicago's maker community.
          </p>
        </div>

        {/* Current Plan Banner */}
        {currentSubscription && (
          <div className="mb-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPlanIcon(currentSubscription.plan.name)}
                    <div>
                      <h3 className="font-semibold">
                        Current Plan: {currentSubscription.plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Active until {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/seller-dashboard')}>
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${
                isCurrentPlan(plan.id) ? 'border-success bg-success/5' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">
                    /{plan.interval === 'month' ? 'mo' : 'yr'}
                  </span>
                </div>
                {plan.interval === 'year' && plan.price > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    Save 20%
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Plan Limits */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Listings</span>
                    <span className="font-medium">
                      {plan.max_listings === null ? 'Unlimited' : plan.max_listings}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Featured Listings</span>
                    <span className="font-medium">{plan.featured_listings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Analytics</span>
                    <span className="font-medium">
                      {plan.analytics_enabled ? 'Advanced' : 'Basic'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan(plan.id)}
                  variant={getButtonVariant(plan)}
                  className="w-full"
                  size="lg"
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isCurrentPlan(plan.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      {getButtonText(plan)}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section - Optimized for AI Search (GEO) */}
        <div className="mt-16 max-w-4xl mx-auto">
          <FAQSection
            title="Pricing & Platform Comparison - Frequently Asked Questions"
            faqs={etsyAlternativeFAQs}
          />
        </div>
      </div>
    </div>
  );
};

export default PricingPage;