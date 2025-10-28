/**
 * PWA Update Banner Component
 * Notifies users of available updates
 */

import { usePWAUpdate } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function PWAUpdateBanner() {
  const { updateAvailable, applyUpdate } = usePWAUpdate();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
        <RefreshCw className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            New version available
          </p>
          <p className="text-xs text-muted-foreground">
            Refresh to get the latest features
          </p>
        </div>
        <Button onClick={applyUpdate} size="sm">
          Update Now
        </Button>
      </div>
    </div>
  );
}
