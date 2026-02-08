import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Gift, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const POPUP_DISMISSED_KEY = 'exitIntentDismissed';
const POPUP_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface ExitIntentPopupProps {
  /** Delay in ms before the popup becomes eligible to show (default: 5000) */
  delay?: number;
}

export function ExitIntentPopup({ delay = 5000 }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if popup should be shown (not dismissed recently, user not logged in)
  const shouldShowPopup = useCallback(() => {
    if (user) return false;

    const dismissedAt = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < POPUP_COOLDOWN_MS) return false;
    }

    return true;
  }, [user]);

  // Make popup eligible after a delay
  useEffect(() => {
    if (!shouldShowPopup()) return;

    const timer = setTimeout(() => {
      setIsEligible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, shouldShowPopup]);

  // Listen for exit intent (mouse leaving viewport at top)
  useEffect(() => {
    if (!isEligible || isOpen) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isEligible, isOpen]);

  // On mobile, show after scroll-up pattern (scrolling back up after scrolling down)
  useEffect(() => {
    if (!isEligible || isOpen) return;

    let lastScrollY = window.scrollY;
    let scrollUpCount = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Detect scroll-up while user was deep in page
      if (currentScrollY < lastScrollY && lastScrollY > 500) {
        scrollUpCount++;
      } else {
        scrollUpCount = 0;
      }

      // Trigger after consistent upward scrolling
      if (scrollUpCount > 5) {
        setIsOpen(true);
        scrollUpCount = 0;
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isEligible, isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: email.trim(),
          source: 'exit_intent',
        },
      });

      if (error) throw error;

      toast({
        title: 'Welcome to the community!',
        description: 'Check your inbox for your exclusive discount code.',
      });

      // Mark as dismissed so it doesn't show again
      localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
      setIsOpen(false);

      // Track conversion
      trackEvent('lead_capture', {
        category: 'exit_intent',
        label: 'landing_page',
      });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact support@craftlocal.net',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEligible) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden">
        {/* Visual header banner */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle className="text-xl text-primary-foreground">
                  Wait — don't miss out!
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 text-sm">
                  Get 10% off your first order from Chicago makers
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Value props */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm">Exclusive access to new maker collections</span>
            </div>
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">First dibs on same-day pickup deals</span>
            </div>
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <span className="text-sm">Members-only discounts and craft fair invites</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              aria-label="Email address for discount"
            />
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Joining...'
              ) : (
                <>
                  Get My 10% Discount
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            No spam. Unsubscribe anytime. Join 4,800+ Chicago craft lovers.
          </p>

          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            No thanks, I'll pay full price
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
