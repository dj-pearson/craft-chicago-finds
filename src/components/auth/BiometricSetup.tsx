/**
 * Biometric Authentication Setup Component
 * Allows users to register and manage fingerprint/face recognition credentials
 */

import { useState } from 'react';
import { useBiometricAuth, BiometricCredential } from '@/hooks/useBiometricAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Fingerprint, Scan, Shield, Smartphone, Laptop, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BiometricSetupProps {
  onComplete?: () => void;
}

export function BiometricSetup({ onComplete }: BiometricSetupProps) {
  const {
    isSupported,
    isPlatformAuthenticatorAvailable,
    credentials,
    credentialsLoading,
    hasRegisteredCredentials,
    registerCredential,
    isRegistering,
    removeCredential,
    isRemoving,
  } = useBiometricAuth();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<BiometricCredential | null>(null);
  const [deviceName, setDeviceName] = useState('');

  const handleRegister = async () => {
    try {
      await registerCredential({ deviceName: deviceName || undefined });
      setShowAddDialog(false);
      setDeviceName('');
      onComplete?.();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleRemove = async () => {
    if (!selectedCredential) return;

    try {
      await removeCredential(selectedCredential.id);
      setShowRemoveDialog(false);
      setSelectedCredential(null);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const getAuthenticatorIcon = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <Fingerprint className="h-5 w-5" />;
      case 'face':
        return <Scan className="h-5 w-5" />;
      case 'security_key':
        return <Shield className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getDeviceIcon = (deviceName: string | null) => {
    const name = deviceName?.toLowerCase() || '';
    if (name.includes('iphone') || name.includes('android') || name.includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const getAuthenticatorLabel = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'face':
        return 'Face Recognition';
      case 'security_key':
        return 'Security Key';
      default:
        return 'Biometric';
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Secure your account with fingerprint or face recognition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <p>Biometric authentication is not supported in this browser.</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Please use a modern browser like Chrome, Safari, or Edge on a device with biometric capabilities.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isPlatformAuthenticatorAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Secure your account with fingerprint or face recognition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <p>No biometric authenticator detected.</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This device doesn't have a fingerprint reader or face recognition capability available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Sign in quickly and securely using your fingerprint or face recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credentialsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {credentials.length > 0 ? (
                <div className="space-y-3">
                  {credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          {getAuthenticatorIcon(credential.authenticator_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(credential.device_name)}
                            <span className="font-medium">
                              {credential.device_name || 'Unknown Device'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {getAuthenticatorLabel(credential.authenticator_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {credential.last_used_at
                              ? `Last used ${formatDistanceToNow(new Date(credential.last_used_at))} ago`
                              : `Added ${formatDistanceToNow(new Date(credential.created_at))} ago`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedCredential(credential);
                          setShowRemoveDialog(true);
                        }}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Fingerprint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No biometric credentials registered</p>
                  <p className="text-sm mt-1">
                    Add your fingerprint or face recognition for faster, more secure sign-in
                  </p>
                </div>
              )}

              <Button
                onClick={() => setShowAddDialog(true)}
                className="w-full"
                disabled={isRegistering}
              >
                <Plus className="h-4 w-4 mr-2" />
                {hasRegisteredCredentials ? 'Add Another Device' : 'Set Up Biometric Login'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Biometric Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Register Biometric Authentication
            </DialogTitle>
            <DialogDescription>
              Use your device's fingerprint reader or face recognition to sign in faster and more
              securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name (Optional)</Label>
              <Input
                id="deviceName"
                placeholder="e.g., My iPhone, Work Laptop"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give this device a name to help identify it later
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">What to expect:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Click "Register" below</li>
                <li>Your device will prompt for biometric verification</li>
                <li>Use your fingerprint or face to confirm</li>
                <li>Done! You can now use biometrics to sign in</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={isRegistering}>
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Register
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Biometric Credential?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{selectedCredential?.device_name || 'this device'}" from your
              biometric login options. You can always add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BiometricSetup;
