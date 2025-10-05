import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Accessibility, 
  Eye, 
  Volume2, 
  MousePointer, 
  Type, 
  Zap,
  RotateCcw,
  Info
} from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilityPanelProps {
  className?: string;
}

export const AccessibilityPanel = ({ className = "" }: AccessibilityPanelProps) => {
  const { settings, updateSetting, resetSettings, isLoading } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const accessibilityFeatures = [
    {
      key: 'highContrast' as const,
      label: 'High Contrast',
      description: 'Increases color contrast for better visibility',
      icon: Eye,
      category: 'Visual',
    },
    {
      key: 'reducedMotion' as const,
      label: 'Reduce Motion',
      description: 'Minimizes animations and transitions',
      icon: Zap,
      category: 'Motion',
    },
    {
      key: 'largeText' as const,
      label: 'Large Text',
      description: 'Increases font size throughout the interface',
      icon: Type,
      category: 'Visual',
    },
    {
      key: 'focusVisible' as const,
      label: 'Enhanced Focus',
      description: 'Makes keyboard navigation more visible',
      icon: MousePointer,
      category: 'Navigation',
    },
    {
      key: 'screenReader' as const,
      label: 'Screen Reader Mode',
      description: 'Optimizes interface for screen readers',
      icon: Volume2,
      category: 'Assistive Tech',
    },
  ];

  const categories = ['Visual', 'Motion', 'Navigation', 'Assistive Tech'];

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${className}`}
            aria-label="Accessibility settings"
          >
            <Accessibility className="h-4 w-4" />
            <span className="sr-only">Accessibility</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const activeSettingsCount = Object.values(settings).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 relative ${className}`}
          aria-label={activeSettingsCount > 0 ? `Accessibility - ${activeSettingsCount} active` : undefined}
        >
          <Accessibility className="h-4 w-4" />
          <span className="hidden sm:inline">Accessibility</span>
          {activeSettingsCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
              aria-hidden="true"
            >
              {activeSettingsCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="accessibility-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <p id="accessibility-description" className="sr-only">
            Customize accessibility settings to personalize your browsing experience
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
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
              <div key={category}>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="space-y-3">
                  {categoryFeatures.map((feature) => {
                    const IconComponent = feature.icon;
                    const isActive = settings[feature.key];

                    return (
                      <Card key={feature.key} className={isActive ? "ring-2 ring-primary" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label 
                                    htmlFor={feature.key}
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
                                  id={feature.key}
                                  checked={isActive}
                                  onCheckedChange={(checked) => updateSetting(feature.key, checked)}
                                  aria-describedby={`${feature.key}-description`}
                                />
                              </div>
                              <p 
                                id={`${feature.key}-description`}
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
              </div>
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
              onClick={resetSettings}
              className="gap-2"
              disabled={activeSettingsCount === 0}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Keyboard Shortcuts Info */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Keyboard Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Tab</span>
                  <span className="text-muted-foreground">Next element</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift + Tab</span>
                  <span className="text-muted-foreground">Previous element</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter/Space</span>
                  <span className="text-muted-foreground">Activate button</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span className="text-muted-foreground">Close dialog</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help with accessibility features? 
              <Button variant="link" className="p-0 h-auto ml-1 text-sm">
                Contact support
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
