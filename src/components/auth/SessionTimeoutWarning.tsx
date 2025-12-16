/**
 * Session Timeout Warning Component
 * Displays a warning dialog when the session is about to expire
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, LogOut } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export function SessionTimeoutWarning() {
  const {
    isWarningVisible,
    timeUntilLogoutFormatted,
    extendSession,
    forceLogout,
  } = useSessionTimeout();

  return (
    <AlertDialog open={isWarningVisible}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your session will expire in <strong className="text-foreground">{timeUntilLogoutFormatted}</strong> due to inactivity.
            </p>
            <p>
              Click "Stay Signed In" to continue your session, or "Log Out" to sign out now.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={forceLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Log Out
          </AlertDialogCancel>
          <AlertDialogAction onClick={extendSession}>
            Stay Signed In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
