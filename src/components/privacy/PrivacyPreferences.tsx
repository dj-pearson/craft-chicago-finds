/**
 * Privacy Preferences Modal
 * Detailed cookie consent preferences management
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, ChevronDown, ChevronUp, ExternalLink, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useConsent } from '@/hooks/useConsent';
import { ConsentCategory, ConsentState } from '@/lib/consent-management';
import { cn } from '@/lib/utils';

interface CategoryAccordionProps {
  category: ConsentCategory;
  title: string;
  description: string;
  required: boolean;
  vendors: Array<{ name: string; purpose: string; policyUrl?: string }>;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function CategoryAccordion({
  category,
  title,
  description,
  required,
  vendors,
  enabled,
  onToggle,
}: CategoryAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className={cn(
          'flex items-center justify-between p-4',
          'bg-muted/30 hover:bg-muted/50 transition-colors'
        )}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 text-left"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{title}</span>
              {required && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Required
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
          </div>
        </button>

        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-muted-foreground">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={required}
            aria-label={`Toggle ${title}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-background border-t">
              <p className="text-sm text-muted-foreground mb-4">{description}</p>

              {vendors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Third-party services:</h4>
                  <ul className="space-y-2">
                    {vendors.map((vendor, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Cookie className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="flex-1">
                          <span className="font-medium">{vendor.name}</span>
                          <span className="text-muted-foreground"> - {vendor.purpose}</span>
                          {vendor.policyUrl && (
                            <a
                              href={vendor.policyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                            >
                              Privacy Policy
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PrivacyPreferences() {
  const {
    consent,
    config,
    showPreferences,
    isLoading,
    closePreferences,
    updatePreferences,
    acceptAll,
    revokeAll,
    applicableRegulations,
    hasGPCSignal,
    isCaliforniaUser,
  } = useConsent();

  const [localPreferences, setLocalPreferences] = useState<Partial<ConsentState>>({
    functional: consent.functional,
    analytics: consent.analytics,
    marketing: consent.marketing,
  });

  // Sync with consent state
  useEffect(() => {
    setLocalPreferences({
      functional: consent.functional,
      analytics: consent.analytics,
      marketing: consent.marketing,
    });
  }, [consent]);

  const handleToggle = (category: ConsentCategory, enabled: boolean) => {
    if (category === 'essential') return; // Essential is always on
    setLocalPreferences(prev => ({ ...prev, [category]: enabled }));
  };

  const handleSave = async () => {
    await updatePreferences(localPreferences);
  };

  if (!showPreferences) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={closePreferences}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="preferences-title" className="text-lg font-semibold">
                Privacy Preferences
              </h2>
            </div>
            <button
              onClick={closePreferences}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Close preferences"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Regulatory notices */}
            {(applicableRegulations.length > 0 || hasGPCSignal) && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {hasGPCSignal && (
                  <p className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Global Privacy Control (GPC) signal detected. We respect your privacy preferences.
                  </p>
                )}
                {isCaliforniaUser && (
                  <p className="text-muted-foreground">
                    As a California resident, you have rights under the CCPA including the right
                    to opt-out of the sale of your personal information.{' '}
                    <a href="/privacy#ccpa" className="text-primary hover:underline">
                      Learn more
                    </a>
                  </p>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Manage your cookie preferences below. Essential cookies are required for the
              website to function and cannot be disabled.
            </p>

            {/* Category toggles */}
            <div className="space-y-3">
              {(Object.entries(config.categories) as [ConsentCategory, typeof config.categories.essential][]).map(
                ([category, categoryConfig]) => (
                  <CategoryAccordion
                    key={category}
                    category={category}
                    title={categoryConfig.title}
                    description={categoryConfig.description}
                    required={categoryConfig.required}
                    vendors={categoryConfig.vendors}
                    enabled={category === 'essential' ? true : (localPreferences[category] ?? false)}
                    onToggle={(enabled) => handleToggle(category, enabled)}
                  />
                )
              )}
            </div>

            {/* Additional links */}
            <div className="pt-4 border-t text-sm text-muted-foreground space-y-2">
              <p>
                For more information about how we use your data, please read our{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/cookie-policy" className="text-primary hover:underline">
                  Cookie Policy
                </a>
                .
              </p>
              <p>
                To request access to or deletion of your data, visit our{' '}
                <a href="/privacy-center" className="text-primary hover:underline">
                  Privacy Center
                </a>
                .
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-4 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={revokeAll}
              disabled={isLoading}
              className="text-muted-foreground hover:text-destructive"
            >
              Reject All Non-Essential
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptAll}
                disabled={isLoading}
              >
                Accept All
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PrivacyPreferences;
