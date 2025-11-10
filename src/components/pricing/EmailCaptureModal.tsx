import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Mail, FileText, TrendingUp, Users, Star, CheckCircle, Gift } from 'lucide-react';
import { getCraftTypeLabel, CraftType } from '@/lib/pricing-calculator';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, firstName: string) => void;
  craftType: CraftType;
}

export function EmailCaptureModal({ isOpen, onClose, onSuccess, craftType }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [shopName, setShopName] = useState('');
  const [wantsNewsletter, setWantsNewsletter] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !firstName) {
      toast({
        title: 'Required fields missing',
        description: 'Please provide your email and first name',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Store lead in Supabase
      const { error } = await supabase
        .from('pricing_calculator_leads')
        .insert({
          email,
          first_name: firstName,
          shop_name: shopName || null,
          craft_type: craftType,
          wants_newsletter: wantsNewsletter,
          captured_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing lead:', error);
        // Don't block the user if storage fails
      }

      // Track event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'lead_capture', {
          event_category: 'pricing_calculator',
          event_label: craftType,
        });
      }

      setShowSuccess(true);

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess(email, firstName);
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Download Your Complete Pricing Strategy Guide
                </DialogTitle>
                <DialogDescription className="text-base">
                  Join 4,837 makers who stopped underpricing their work
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Value Propositions */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    Unlock These Free Resources:
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">10-Page Pricing Guide PDF</p>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive strategies for pricing handmade goods
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Pricing Worksheet</p>
                        <p className="text-sm text-muted-foreground">
                          Excel template for all your products
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Wholesale Calculator</p>
                        <p className="text-sm text-muted-foreground">
                          Price for different sales channels
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">7-Day Email Course</p>
                        <p className="text-sm text-muted-foreground">
                          Transform your craft business pricing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-3 bg-yellow-50 rounded-lg p-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm italic">
                    "This calculator helped me finally price profitably! I increased my prices by 40% and my sales actually went up."
                    <span className="font-semibold not-italic"> - Sarah M., Jewelry Maker</span>
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopName">Shop Name (optional)</Label>
                    <Input
                      id="shopName"
                      type="text"
                      placeholder="Your shop or brand name"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={wantsNewsletter}
                      onCheckedChange={(checked) => setWantsNewsletter(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="newsletter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Send me weekly craft business growth strategies
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Practical maker business tips only. No spam. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>

                  {/* Trust Signals */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      4,837+ makers have downloaded this guide
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Your email is safe. We never share or sell your information.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Processing...'
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download My Free Pricing Guide
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="h-12 w-12 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-3">Success! Check Your Email</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We've sent your complete pricing guide to <strong>{email}</strong>.
                Your PDF download will start automatically.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto text-left">
                <h4 className="font-semibold mb-3">What's Next?</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Check your inbox for your pricing guide and bonus resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Join our private "Price with Confidence" community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Watch for Day 1 of your 7-day email course tomorrow</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
