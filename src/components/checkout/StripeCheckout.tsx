import { useState, useEffect } from 'react';
import { useStripe } from '@/hooks/useStripe';
import { useAuth } from '@/hooks/useAuth';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, MapPin, Truck, Shield, AlertTriangle } from 'lucide-react';

interface CheckoutProps {
  listing: {
    id: string;
    title: string;
    price: number;
    seller_id: string;
    local_pickup_available: boolean;
    shipping_available: boolean;
    pickup_location?: string;
  };
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export const StripeCheckout = ({ listing, onSuccess, onCancel }: CheckoutProps) => {
  const { stripe, isLoading: stripeLoading } = useStripe();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    analyzeTransaction, 
    isAnalyzing, 
    trustScore, 
    getSecurityStatus,
    isInitialized 
  } = useFraudDetection();
  
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'local_pickup' | 'shipping'>('local_pickup');
  const [notes, setNotes] = useState('');
  const [fraudAnalysisResult, setFraudAnalysisResult] = useState<any>(null);
  const [showFraudWarning, setShowFraudWarning] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const PLATFORM_FEE_RATE = 0.1; // 10% platform fee
  const subtotal = listing.price * quantity;
  const platformFee = subtotal * PLATFORM_FEE_RATE;
  const total = subtotal + platformFee;

  // Run fraud analysis when transaction details change
  useEffect(() => {
    if (isInitialized && user && total > 0) {
      runFraudAnalysis();
    }
  }, [total, fulfillmentMethod, isInitialized, user]);

  const runFraudAnalysis = async () => {
    if (!user) return;

    try {
      const result = await analyzeTransaction({
        amount: total,
        listingId: listing.id,
        sellerId: listing.seller_id,
        shippingAddress: fulfillmentMethod === 'shipping' ? shippingAddress : undefined
      });

      setFraudAnalysisResult(result);
      setShowFraudWarning(result.shouldReview || result.shouldBlock);
    } catch (error) {
      console.error('Fraud analysis failed:', error);
    }
  };

  const handleCheckout = async () => {
    if (!stripe || !user) return;

    setLoading(true);
    try {
      // Validate required fields
      if (fulfillmentMethod === 'shipping') {
        const requiredFields = ['name', 'address', 'city', 'state', 'zip'];
        const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof ShippingAddress]);
        
        if (missingFields.length > 0) {
          toast({
            title: 'Missing shipping information',
            description: 'Please fill in all shipping address fields.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      // Run final fraud analysis
      const fraudResult = await analyzeTransaction({
        amount: total,
        listingId: listing.id,
        sellerId: listing.seller_id,
        shippingAddress: fulfillmentMethod === 'shipping' ? shippingAddress : undefined
      });

      // Block transaction if fraud score is too high
      if (fraudResult.shouldBlock) {
        toast({
          title: 'Transaction Blocked',
          description: 'This transaction has been flagged for security review. Please contact support.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Show warning for review-flagged transactions
      if (fraudResult.shouldReview && !showFraudWarning) {
        setFraudAnalysisResult(fraudResult);
        setShowFraudWarning(true);
        setLoading(false);
        return;
      }

      // Create payment intent
      const { data: paymentIntentData, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          listing_id: listing.id,
          seller_id: listing.seller_id,
          quantity,
          fulfillment_method: fulfillmentMethod,
          shipping_address: fulfillmentMethod === 'shipping' ? shippingAddress : null,
          notes: notes || null
        }
      });

      if (paymentError || !paymentIntentData?.client_secret) {
        throw new Error(paymentError?.message || 'Failed to create payment intent');
      }

      // Confirm payment with demo card element
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.client_secret,
        {
          payment_method: {
            card: {
              token: 'tok_visa' // Demo token for testing
            }
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create order in database
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            buyer_id: user.id,
            seller_id: listing.seller_id,
            listing_id: listing.id,
            quantity,
            total_amount: total,
            commission_amount: platformFee,
            fulfillment_method: fulfillmentMethod,
            shipping_address: fulfillmentMethod === 'shipping' ? JSON.stringify(shippingAddress) : null,
            pickup_location: fulfillmentMethod === 'local_pickup' ? listing.pickup_location : null,
            notes,
            payment_status: 'completed',
            stripe_payment_intent_id: paymentIntent.id
          }])
          .select()
          .single();

        if (orderError) {
          throw new Error('Failed to create order');
        }

        onSuccess(orderData.id);
        
        toast({
          title: 'Payment successful!',
          description: 'Your order has been placed successfully.',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For demo purposes, we'll redirect to Stripe Checkout instead of using Elements
  const handleStripeCheckout = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: sessionData, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          listing_id: listing.id,
          quantity,
          fulfillment_method: fulfillmentMethod,
          shipping_address: fulfillmentMethod === 'shipping' ? shippingAddress : null,
          notes: notes || null,
          success_url: `${window.location.origin}/orders`,
          cancel_url: window.location.href
        }
      });

      if (error || !sessionData?.url) {
        throw new Error(error?.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = sessionData.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  if (stripeLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading payment system...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Status */}
          {isInitialized && trustScore !== null && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Security Status</span>
                <Badge variant="outline" className={`text-xs ${
                  getSecurityStatus().color === 'green' ? 'border-green-500 text-green-700' :
                  getSecurityStatus().color === 'yellow' ? 'border-yellow-500 text-yellow-700' :
                  getSecurityStatus().color === 'orange' ? 'border-orange-500 text-orange-700' :
                  getSecurityStatus().color === 'red' ? 'border-red-500 text-red-700' :
                  'border-gray-500 text-gray-700'
                }`}>
                  Trust Score: {trustScore}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {getSecurityStatus().message}
              </p>
            </div>
          )}

          {/* Fraud Warning */}
          {showFraudWarning && fraudAnalysisResult && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-medium">Security Review Required</p>
                  <p className="text-sm">
                    This transaction has been flagged for additional security review 
                    (Risk Score: {fraudAnalysisResult.riskScore}/100). 
                    {fraudAnalysisResult.recommendation === 'review' 
                      ? 'You may proceed, but additional verification may be required.'
                      : 'Please contact support before proceeding.'
                    }
                  </p>
                  {fraudAnalysisResult.signals.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer">View Security Details</summary>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {fraudAnalysisResult.signals.slice(0, 3).map((signal: any, index: number) => (
                          <li key={index}>{signal.description}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFraudWarning(false)}
                    >
                      Proceed Anyway
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onCancel}
                    >
                      Cancel Transaction
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Product Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{listing.title}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Price per item:</span>
                <span>${listing.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee (10%):</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Method */}
          <div>
            <Label className="text-base font-semibold">Fulfillment Method</Label>
            <RadioGroup
              value={fulfillmentMethod}
              onValueChange={(value) => setFulfillmentMethod(value as 'local_pickup' | 'shipping')}
              className="mt-2"
            >
              {listing.local_pickup_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local_pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer">
                    <MapPin className="h-4 w-4" />
                    Local Pickup
                    {listing.pickup_location && (
                      <span className="text-sm text-muted-foreground">
                        at {listing.pickup_location}
                      </span>
                    )}
                  </Label>
                </div>
              )}
              {listing.shipping_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shipping" id="shipping" />
                  <Label htmlFor="shipping" className="flex items-center gap-2 cursor-pointer">
                    <Truck className="h-4 w-4" />
                    Shipping
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Shipping Address */}
          {fulfillmentMethod === 'shipping' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Chicago"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="IL"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, zip: e.target.value }))}
                      placeholder="60601"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Notes */}
          <div>
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions for the seller..."
              className="mt-2"
            />
          </div>

          {/* Checkout Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleStripeCheckout} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${total.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};