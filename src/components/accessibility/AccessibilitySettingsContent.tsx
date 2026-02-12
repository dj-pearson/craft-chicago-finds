/**
 * Accessibility Settings Content
 *
 * Shared settings UI used by both the header panel dialog and the
 * floating accessibility widget. Extracted to ensure consistent
 * experience across all entry points.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Volume2,
  MousePointer,
  Type,
  Zap,
  RotateCcw,
  Info,
  Keyboard,
} from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { LiveRegion } from './LiveRegion';
import { useState } from 'react';

const accessibilityFeatures = [
  {
    key: 'highContrast' as const,
    label: 'High Contrast',
    description: 'Increases color contrast for better visibility. Meets WCAG 2.1 AA 4.5:1 contrast ratio.',
    icon: Eye,
    category: 'Visual',
  },
  {
    key: 'reducedMotion' as const,
    label: 'Reduce Motion',
    description: 'Minimizes animations and transitions for users sensitive to motion.',
    icon: Zap,
    category: 'Motion',
  },
  {
    key: 'largeText' as const,
    label: 'Large Text',
    description: 'Increases font size throughout the interface. Text scales up to 200% without loss of content.',
    icon: Type,
    category: 'Visual',
  },
  {
    key: 'focusVisible' as const,
    label: 'Enhanced Focus',
    description: 'Makes keyboard navigation more visible with prominent focus indicators.',
    icon: MousePointer,
    category: 'Navigation',
  },
  {
    key: 'screenReader' as const,
    label: 'Screen Reader Mode',
    description: 'Optimizes interface for screen readers. Reveals hidden labels and marks missing alt text.',
    icon: Volume2,
    category: 'Assistive Tech',
  },
];

const categories = ['Visual', 'Motion', 'Navigation', 'Assistive Tech'];

export function AccessibilitySettingsContent() {
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [announcement, setAnnouncement] = useState('');

  const activeSettingsCount = Object.values(settings).filter(Boolean).length;

  const handleToggle = (key: keyof typeof settings, checked: boolean) => {
    updateSetting(key, checked);
    const feature = accessibilityFeatures.find(f => f.key === key);
    if (feature) {
      setAnnouncement(`${feature.label} ${checked ? 'enabled' : 'disabled'}`);
    }
  };

  const handleReset = () => {
    resetSettings();
    setAnnouncement('All accessibility settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      <LiveRegion message={announcement} politeness="assertive" />

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Personalize your experience</p>
              <p>These settings are saved to your device and will apply across all pages. Some settings may also be detected automatically based on your system preferences.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings by Category */}
      {categories.map((category) => {
        const categoryFeatures = accessibilityFeatures.filter(f => f.category === category);
        if (categoryFeatures.length === 0) return null;

        return (
          <fieldset key={category} className="border-none p-0 m-0">
            <legend className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              {category}
            </legend>
            <div className="space-y-3" role="group" aria-label={`${category} settings`}>
              {categoryFeatures.map((feature) => {
                const IconComponent = feature.icon;
                const isActive = settings[feature.key];

                return (
                  <Card key={feature.key} className={isActive ? "ring-2 ring-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                          aria-hidden="true"
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label
                                htmlFor={`a11y-${feature.key}`}
                                className="text-base font-medium cursor-pointer"
                              >
                                {feature.label}
                              </Label>
                              {isActive && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <Switch
                              id={`a11y-${feature.key}`}
                              checked={isActive}
                              onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                              aria-describedby={`a11y-${feature.key}-description`}
                            />
                          </div>
                          <p
                            id={`a11y-${feature.key}-description`}
                            className="text-sm text-muted-foreground"
                          >
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <Separator />

      {/* Reset Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Reset Settings</h3>
          <p className="text-sm text-muted-foreground">
            Restore all accessibility settings to their defaults
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2"
          disabled={activeSettingsCount === 0}
          aria-label="Reset all accessibility settings to defaults"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>

      {/* Keyboard Shortcuts Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            Keyboard Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Alt + A</kbd>
              <span className="text-muted-foreground">Open this panel</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Tab</kbd>
              <span className="text-muted-foreground">Next element</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Shift + Tab</kbd>
              <span className="text-muted-foreground">Previous element</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Enter / Space</kbd>
              <span className="text-muted-foreground">Activate button</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Escape</kbd>
              <span className="text-muted-foreground">Close dialog</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Arrow keys</kbd>
              <span className="text-muted-foreground">Navigate options</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need help with accessibility features?{' '}
          <a
            href="mailto:support@craftlocal.net"
            className="text-primary underline hover:text-primary/80"
          >
            Contact support
          </a>
        </p>
        <p className="mt-1 text-xs">
          Or visit our{' '}
          <a href="/accessibility" className="text-primary underline hover:text-primary/80">
            Accessibility Statement
          </a>{' '}
          for more information.
        </p>
      </div>
    </div>
  );
}
