/**
 * Floating Accessibility Widget
 *
 * A persistent floating button visible on ALL screen sizes that opens
 * the accessibility settings panel. Ensures users with disabilities
 * can always access accessibility controls regardless of device or
 * scroll position.
 *
 * WCAG 2.1 AA Compliance:
 * - 2.1.1 Keyboard accessible (Alt+A shortcut)
 * - 2.4.7 Focus visible (enhanced focus ring)
 * - 1.4.11 Non-text contrast (3:1 minimum)
 * - 4.1.2 Name, Role, Value (proper ARIA)
 */

import { useState, useEffect, useCallback } from 'react';
import { Accessibility } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccessibility } from './AccessibilityProvider';
import { AccessibilitySettingsContent } from './AccessibilitySettingsContent';
import { LiveRegion } from './LiveRegion';

export function AccessibilityFloatingWidget() {
  const { settings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const activeCount = Object.values(settings).filter(Boolean).length;

  // Global keyboard shortcut: Alt+A to open accessibility settings
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      setIsOpen(prev => !prev);
      setAnnouncement('Accessibility settings opened');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Clear announcement after screen reader picks it up
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return (
    <>
      <LiveRegion message={announcement} politeness="polite" />

      {/* Floating button - positioned above mobile bottom nav */}
      <div
        className="fixed bottom-24 md:bottom-6 left-4 z-[100] print:hidden"
        role="region"
        aria-label="Quick accessibility access"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary-foreground/20 p-0"
          aria-label={`Open accessibility settings${activeCount > 0 ? `, ${activeCount} features active` : ''}. Keyboard shortcut: Alt+A`}
        >
          <Accessibility className="h-5 w-5" aria-hidden="true" />
        </Button>
        {activeCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground p-0 text-xs font-bold flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            {activeCount}
          </Badge>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          aria-describedby="floating-a11y-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" aria-hidden="true" />
              Accessibility Settings
            </DialogTitle>
            <p id="floating-a11y-description" className="sr-only">
              Customize accessibility settings to personalize your browsing experience. Press Alt+A to toggle this panel.
            </p>
          </DialogHeader>

          <AccessibilitySettingsContent />
        </DialogContent>
      </Dialog>
    </>
  );
}
