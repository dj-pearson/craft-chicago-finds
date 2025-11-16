/* @ts-nocheck */
import { useEffect, useState } from 'react';
import { useStripe } from '@/hooks/useStripe';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, CreditCard } from 'lucide-react';

interface AppleGooglePayButtonProps {
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const AppleGooglePayButton = ({ onSuccess, onError, disabled }: AppleGooglePayButtonProps) => {
  const { stripe } = useStripe();
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  const PLATFORM_FEE_RATE = 0.1;
  const platformFee = totalAmount * PLATFORM_FEE_RATE;
  const finalTotal = totalAmount + platformFee;

  useEffect(() => {
    if (!stripe || items.length === 0) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: Math.round(finalTotal * 100), // Convert to cents
      },
      displayItems: [
        {
          label: 'Subtotal',
          amount: Math.round(totalAmount * 100),
        },
        {
          label: 'Platform fee',
          amount: Math.round(platformFee * 100),
        },
      ],
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: false,
      requestShipping: true,
    });

    // Check if payment request is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (event) => {
      try {
        // Create checkout session for Apple/Google Pay
        const { data: sessionData, error } = await supabase.functions.invoke('create-express-checkout', {
          body: {
            cart_items: items,
            payment_method_id: event.paymentMethod.id,
            customer_info: {
              name: event.paymentMethod.billing_details.name,
              email: event.paymentMethod.billing_details.email,
              phone: event.paymentMethod.billing_details.phone,
            },
            shipping_address: event.shippingAddress ? {
              name: event.shippingAddress.recipient,
              address: event.shippingAddress.addressLine?.[0] || '',
              city: event.shippingAddress.city,
              state: event.shippingAddress.region,
              zip: event.shippingAddress.postalCode,
            } : null,
            user_id: user?.id || null,
            fulfillment_method: 'mixed'
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        // Complete the payment
        event.complete('success');
        
        // Clear cart and notify success
        clearCart();
        
        toast({
          title: 'Payment successful!',
          description: 'Your order has been placed successfully.',
        });

        if (onSuccess && sessionData?.order_id) {
          onSuccess(sessionData.order_id);
        }
        
      } catch (error) {
        console.error('Express checkout error:', error);
        event.complete('fail');
        
        const errorMessage = error instanceof Error ? error.message : 'Payment failed';
        toast({
          title: 'Payment failed',
          description: errorMessage,
          variant: 'destructive'
        });
        
        if (onError) {
          onError(errorMessage);
        }
      }
    });

  }, [stripe, items, finalTotal, totalAmount, platformFee, user, clearCart, toast, onSuccess, onError]);

  if (!canMakePayment || !paymentRequest || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => paymentRequest.show()}
        disabled={disabled}
        className="w-full bg-black hover:bg-black/90 text-white"
        size="lg"
      >
        <Smartphone className="h-4 w-4 mr-2" />
        Apple Pay / Google Pay
      </Button>
      
      <div className="text-center text-sm text-muted-foreground">
        or
      </div>
    </div>
  );
};

export default AppleGooglePayButton;