/**
 * Cookie Consent Banner
 * GDPR/CCPA compliant cookie consent banner
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConsent } from '@/hooks/useConsent';
import { cn } from '@/lib/utils';

export function ConsentBanner() {
  const {
    showBanner,
    isLoading,
    acceptAll,
    acceptEssentialOnly,
    openPreferences,
    closeBanner,
    applicableRegulations,
    hasGPCSignal,
  } = useConsent();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background/95 backdrop-blur-md',
          'border-t border-border shadow-lg',
          'p-4 md:p-6'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-banner-title"
        aria-describedby="consent-banner-description"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 id="consent-banner-title" className="text-lg font-semibold">
                  We value your privacy
                </h2>
                {hasGPCSignal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Shield className="h-3 w-3" aria-hidden="true" />
                    GPC Detected
                  </span>
                )}
              </div>

              <p id="consent-banner-description" className="text-sm text-muted-foreground max-w-2xl">
                We use cookies and similar technologies to enhance your browsing experience,
                analyze site traffic, and personalize content. By clicking "Accept All", you
                consent to our use of cookies.{' '}
                <a
                  href="/cookie-policy"
                  className="text-primary underline hover:no-underline"
                >
                  Cookie Policy
                </a>{' '}
                |{' '}
                <a
                  href="/privacy"
                  className="text-primary underline hover:no-underline"
                >
                  Privacy Policy
                </a>
              </p>

              {applicableRegulations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Applicable regulations: {applicableRegulations.join(', ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:flex-col lg:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={openPreferences}
                disabled={isLoading}
                className="gap-2"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Customize
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={acceptEssentialOnly}
                disabled={isLoading}
              >
                Essential Only
              </Button>

              <Button
                size="sm"
                onClick={acceptAll}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Saving...' : 'Accept All'}
              </Button>
            </div>
          </div>

          {/* Close button for accessibility */}
          <button
            onClick={closeBanner}
            className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConsentBanner;
