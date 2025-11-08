import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ArrowLeft, Package, Truck, MapPin, Mail, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GiftModeToggle } from '@/components/cart/GiftModeToggle';
import { validateAddress } from '@/lib/address-validation';

interface ShippingAddress {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export const GuestCheckout = () => {
  const { items, clearCart, totalAmount, itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [sendMagicLink, setSendMagicLink] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'mixed' | 'shipping' | 'local_pickup'>('mixed');
  const [notes, setNotes] = useState('');
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [giftMode, setGiftMode] = useState(
    location.state?.giftMode || {
      enabled: false,
      message: '',
      recipientEmail: '',
      scheduledShipDate: '',
      hidePrices: false
    }
  );
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  // Validate address whenever it changes
  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    const newAddress = { ...shippingAddress, [field]: value };
    setShippingAddress(newAddress);

    // Only validate if shipping is required and all address fields are filled
    if (fulfillmentMethod === 'shipping' || (fulfillmentMethod === 'mixed' && hasShippingItems)) {
      if (newAddress.address && newAddress.city && newAddress.state && newAddress.zip) {
        const validation = validateAddress({
          street: newAddress.address,
          city: newAddress.city,
          state: newAddress.state,
          zip: newAddress.zip
        });
        setAddressValidation(validation);
        
        // Auto-normalize if valid
        if (validation.normalized) {
          setShippingAddress(prev => ({
            ...prev,
            address: validation.normalized!.street,
            city: validation.normalized!.city,
            state: validation.normalized!.state,
            zip: validation.normalized!.zip
          }));
        }
      } else {
        setAddressValidation(null);
      }
    }
  };

  const PLATFORM_FEE_RATE = 0.1; // 10%
  const platformFee = totalAmount * PLATFORM_FEE_RATE;
  const finalTotal = totalAmount + platformFee;

  // Group items by seller
  const itemsBySeller = items.reduce((acc, item) => {
    if (!acc[item.seller_id]) {
      acc[item.seller_id] = {
        seller_name: item.seller_name,
        items: [],
        subtotal: 0
      };
    }
    acc[item.seller_id].items.push(item);
    acc[item.seller_id].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { seller_name: string; items: typeof items; subtotal: number }>);

  // Check fulfillment options
  const hasShippingItems = items.some(item => item.shipping_available);
  const hasPickupItems = items.some(item => item.local_pickup_available);

  const handleGuestCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add some items to your cart before checkout.',
        variant: 'destructive'
      });
      return;
    }

    // Validate required fields
    const requiredFields = ['name', 'email'];
    if (fulfillmentMethod === 'shipping' || (fulfillmentMethod === 'mixed' && hasShippingItems)) {
      requiredFields.push('address', 'city', 'state', 'zip');
    }
    
    const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof ShippingAddress]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    // Validate address format if shipping
    if (fulfillmentMethod === 'shipping' || (fulfillmentMethod === 'mixed' && hasShippingItems)) {
      const validation = validateAddress({
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip
      });

      if (!validation.isValid) {
        toast({
          title: 'Invalid address',
          description: validation.errors.join('. '),
          variant: 'destructive'
        });
        return;
      }

      if (validation.warnings.length > 0) {
        toast({
          title: 'Address warning',
          description: validation.warnings.join('. ') + ' Please verify your address.',
          variant: 'default'
        });
      }
    }

    setLoading(true);
    try {
      // Create guest checkout session
      const { data: sessionData, error } = await supabase.functions.invoke('create-guest-checkout', {
        body: {
          cart_items: items,
          guest_info: shippingAddress,
          fulfillment_method: fulfillmentMethod,
          shipping_address: (fulfillmentMethod === 'shipping' || fulfillmentMethod === 'mixed') ? shippingAddress : null,
          notes: notes || null,
          send_magic_link: sendMagicLink,
          gift_mode: giftMode.enabled ? {
            message: giftMode.message,
            recipient_email: giftMode.recipientEmail,
            scheduled_ship_date: giftMode.scheduledShipDate,
            hide_prices: giftMode.hidePrices
          } : null,
          success_url: `${window.location.origin}/order-confirmation?checkout=success&guest=true`,
          cancel_url: `${window.location.origin}/cart`
        }
      });

      if (error || !sessionData?.url) {
        throw new Error(error?.message || 'Failed to create checkout session');
      }

      if (sendMagicLink) {
        toast({
          title: 'Magic link sent!',
          description: 'Check your email for a link to track your order without creating an account.',
        });
      }

      // Redirect to Stripe Checkout
      // Note: Cart will be cleared after successful payment confirmation
      window.location.href = sessionData.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/cart')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Guest Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="magic-link"
                    checked={sendMagicLink}
                    onChange={(e) => setSendMagicLink(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="magic-link" className="text-sm cursor-pointer">
                    Send me a magic link to track my order (no password required)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Fulfillment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={fulfillmentMethod}
                  onValueChange={(value) => setFulfillmentMethod(value as any)}
                  className="space-y-3"
                >
                  {hasShippingItems && hasPickupItems && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed" className="flex items-center gap-2 cursor-pointer">
                        <Truck className="h-4 w-4" />
                        Mixed (Shipping & Pickup)
                        <Badge variant="outline">Best for multiple sellers</Badge>
                      </Label>
                    </div>
                  )}
                  {hasShippingItems && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shipping" id="shipping" />
                      <Label htmlFor="shipping" className="flex items-center gap-2 cursor-pointer">
                        <Truck className="h-4 w-4" />
                        Shipping Only
                      </Label>
                    </div>
                  )}
                  {hasPickupItems && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="local_pickup" id="local_pickup" />
                      <Label htmlFor="local_pickup" className="flex items-center gap-2 cursor-pointer">
                        <MapPin className="h-4 w-4" />
                        Local Pickup Only
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {(fulfillmentMethod === 'shipping' || fulfillmentMethod === 'mixed') && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) => handleAddressChange('address', e.target.value)}
                        placeholder="123 Main St, Apt 4B"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="Chicago"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="IL"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input
                        id="zip"
                        value={shippingAddress.zip}
                        onChange={(e) => handleAddressChange('zip', e.target.value)}
                        placeholder="60601"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  {/* Address Validation Feedback */}
                  {addressValidation && (
                    <div className="space-y-2">
                      {addressValidation.isValid && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Address looks good!
                          </AlertDescription>
                        </Alert>
                      )}
                      {addressValidation.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="list-disc list-inside">
                              {addressValidation.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      {addressValidation.warnings.length > 0 && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <ul className="list-disc list-inside">
                              {addressValidation.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Gift Mode */}
            <GiftModeToggle
              giftMode={giftMode}
              onGiftModeChange={setGiftMode}
            />

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for the sellers..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            {/* Order Items */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(itemsBySeller).map(([sellerId, { seller_name, items: sellerItems, subtotal }]) => (
                  <div key={sellerId} className="space-y-3">
                    <div className="font-semibold text-primary">From {seller_name}</div>
                    {sellerItems.map((item) => (
                      <div key={item.listing_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    <div className="text-right font-semibold">
                      Subtotal: ${subtotal.toFixed(2)}
                    </div>
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform fee (10%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleGuestCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${finalTotal.toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Secure payment with Stripe</p>
                  <p>• Apple Pay / Google Pay available</p>
                  <p>• No account required</p>
                  <p>• Individual tracking for each seller</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckout;