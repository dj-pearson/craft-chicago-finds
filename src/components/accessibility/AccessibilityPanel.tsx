import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accessibility } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { AccessibilitySettingsContent } from './AccessibilitySettingsContent';

interface AccessibilityPanelProps {
  className?: string;
}

export const AccessibilityPanel = ({ className = "" }: AccessibilityPanelProps) => {
  const { settings, isLoading } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

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
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Accessibility</span>
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby="accessibility-loading">
          <div className="flex items-center justify-center p-8" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
            <span id="accessibility-loading" className="sr-only">Loading accessibility settings</span>
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
          aria-label={`Accessibility settings${activeSettingsCount > 0 ? `, ${activeSettingsCount} active` : ''}`}
        >
          <Accessibility className="h-4 w-4" aria-hidden="true" />
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
            <Accessibility className="h-5 w-5" aria-hidden="true" />
            Accessibility Settings
          </DialogTitle>
          <p id="accessibility-description" className="sr-only">
            Customize accessibility settings to personalize your browsing experience. Press Alt+A to open this panel from anywhere.
          </p>
        </DialogHeader>

        <AccessibilitySettingsContent />
      </DialogContent>
    </Dialog>
  );
};
