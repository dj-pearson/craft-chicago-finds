/**
 * CCPA Compliance Controls
 * California Consumer Privacy Act compliance features
 */

import { useState, useEffect } from 'react';
import { Shield, Ban, CheckCircle2, Loader2, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CCPAControlsProps {
  showDoNotSellOnly?: boolean;
  className?: string;
}

interface CCPASettings {
  doNotSell: boolean;
  doNotShare: boolean;
  limitSensitiveData: boolean;
  optedOutAt: string | null;
}

export function CCPAControls({ showDoNotSellOnly = false, className }: CCPAControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<CCPASettings>({
    doNotSell: false,
    doNotShare: false,
    limitSensitiveData: false,
    optedOutAt: null,
  });

  // Fetch CCPA settings
  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ccpa_do_not_sell')
        .select('opted_out, opted_out_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          doNotSell: data.opted_out,
          doNotShare: data.opted_out, // CPRA extension
          limitSensitiveData: false,
          optedOutAt: data.opted_out_at,
        });
      }
    } catch (error) {
      console.error('Error fetching CCPA settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDoNotSell = async (optedOut: boolean) => {
    setIsSaving(true);
    try {
      const email = user?.email;

      // Check if record exists
      const { data: existing } = await supabase
        .from('ccpa_do_not_sell')
        .select('id')
        .eq(user ? 'user_id' : 'email', user ? user.id : email)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('ccpa_do_not_sell')
          .update({
            opted_out: optedOut,
            opted_out_at: optedOut ? new Date().toISOString() : null,
            opted_in_at: !optedOut ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ccpa_do_not_sell')
          .insert({
            user_id: user?.id || null,
            email: email,
            opted_out: optedOut,
            opted_out_at: optedOut ? new Date().toISOString() : null,
            verification_method: user ? 'account' : 'email',
          });

        if (error) throw error;
      }

      setSettings(prev => ({
        ...prev,
        doNotSell: optedOut,
        doNotShare: optedOut,
        optedOutAt: optedOut ? new Date().toISOString() : null,
      }));

      toast({
        title: optedOut ? 'Opted Out Successfully' : 'Preferences Updated',
        description: optedOut
          ? 'We will no longer sell or share your personal information.'
          : 'Your preferences have been updated.',
      });
    } catch (error) {
      console.error('Error updating CCPA settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Simple Do Not Sell toggle only
  if (showDoNotSellOnly) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="do-not-sell" className="text-base font-medium">
              Do Not Sell or Share My Personal Information
            </Label>
            <p className="text-sm text-muted-foreground">
              Opt out of the sale or sharing of your personal information
            </p>
          </div>
          <Switch
            id="do-not-sell"
            checked={settings.doNotSell}
            onCheckedChange={updateDoNotSell}
            disabled={isSaving}
          />
        </div>

        {settings.doNotSell && settings.optedOutAt && (
          <p className="text-xs text-muted-foreground">
            Opted out on: {new Date(settings.optedOutAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  // Full CCPA controls
  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status */}
      {settings.doNotSell && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            You have opted out of the sale and sharing of your personal information.
            {settings.optedOutAt && (
              <span className="block text-xs mt-1">
                Since: {new Date(settings.optedOutAt).toLocaleDateString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ban className="h-5 w-5 text-primary" aria-hidden="true" />
            Do Not Sell or Share
          </CardTitle>
          <CardDescription>
            Under the CCPA and CPRA, California residents have the right to opt out of the
            sale or sharing of their personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="ccpa-opt-out" className="text-base font-medium">
                Opt Out of Sale/Sharing
              </Label>
              <p className="text-sm text-muted-foreground">
                We will not sell or share your personal information with third parties
              </p>
            </div>
            <Switch
              id="ccpa-opt-out"
              checked={settings.doNotSell}
              onCheckedChange={updateDoNotSell}
              disabled={isSaving}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> This opt-out applies to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Sale of personal information to third parties</li>
              <li>Cross-context behavioral advertising</li>
              <li>Sharing for targeted advertising purposes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Information Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="what-is-sale">
          <AccordionTrigger className="text-sm">
            What does "sale" and "share" mean under CCPA?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Under the CCPA, "sale" includes the disclosure of personal information to
              third parties for monetary or other valuable consideration.
            </p>
            <p>
              Under the CPRA, "sharing" includes the disclosure of personal information
              for cross-context behavioral advertising purposes, even without monetary
              consideration.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="what-data">
          <AccordionTrigger className="text-sm">
            What personal information is affected?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <p>Categories of personal information that may be shared include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Identifiers (name, email, IP address)</li>
              <li>Commercial information (purchase history)</li>
              <li>Internet activity (browsing, search history)</li>
              <li>Geolocation data</li>
              <li>Inferences drawn from the above</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="additional-rights">
          <AccordionTrigger className="text-sm">
            Your additional CCPA rights
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>As a California resident, you also have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Know</strong> - Request what personal information we collect and how we use it</li>
              <li><strong>Delete</strong> - Request deletion of your personal information</li>
              <li><strong>Correct</strong> - Request correction of inaccurate information</li>
              <li><strong>Limit Use</strong> - Limit the use of sensitive personal information</li>
              <li><strong>Non-discrimination</strong> - Not be discriminated against for exercising your rights</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, visit our{' '}
              <a href="/privacy-center" className="text-primary hover:underline">
                Privacy Center
              </a>
              .
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="financial-incentives">
          <AccordionTrigger className="text-sm">
            Financial incentive programs
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>
              We may offer financial incentives for the collection, sale, or retention of
              personal information (such as loyalty programs or promotional discounts).
            </p>
            <p>
              Participation in these programs is voluntary and you may opt out at any time.
              The value of your data is calculated based on the expenses related to the
              offering of the incentive.
            </p>
            <p>
              <a
                href="/terms#financial-incentives"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Learn more about our financial incentive programs
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Notice at Collection */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Notice at Collection:</strong> We collect personal information as
                described in our Privacy Policy. We use this information for business and
                commercial purposes including providing our services, processing transactions,
                and improving our offerings.
              </p>
              <p>
                For more details, please review our{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Agent */}
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Authorized Agent:</strong> You may designate an authorized agent to make
          requests on your behalf. We may require verification that you authorized the agent.
          Contact us at{' '}
          <a href="mailto:privacy@craftlocal.com" className="text-primary hover:underline">
            privacy@craftlocal.com
          </a>
          {' '}for authorized agent requests.
        </p>
      </div>
    </div>
  );
}

export default CCPAControls;
