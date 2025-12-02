/**
 * MFA Verification Component
 * Used during login when MFA is required
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Shield, Smartphone, Key, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MFAVerificationProps {
  onVerify: (code: string, method: 'totp' | 'backup') => Promise<boolean>;
  onTrustDevice?: (trust: boolean) => void;
  onCancel?: () => void;
  email?: string;
  isLoading?: boolean;
  error?: string | null;
  attemptsRemaining?: number;
}

export function MFAVerification({
  onVerify,
  onTrustDevice,
  onCancel,
  email,
  isLoading = false,
  error,
  attemptsRemaining,
}: MFAVerificationProps) {
  const [activeTab, setActiveTab] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTab]);

  // Handle TOTP verification
  const handleTOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || verifying || isLoading) return;

    setVerifying(true);
    setLocalError(null);

    try {
      const success = await onVerify(code, 'totp');
      if (success && onTrustDevice) {
        onTrustDevice(trustDevice);
      }
      if (!success) {
        setLocalError('Invalid verification code. Please try again.');
        setCode('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  // Handle backup code verification
  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = backupCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleanCode.length !== 8 || verifying || isLoading) return;

    setVerifying(true);
    setLocalError(null);

    try {
      const success = await onVerify(backupCode, 'backup');
      if (success && onTrustDevice) {
        onTrustDevice(trustDevice);
      }
      if (!success) {
        setLocalError('Invalid backup code. Please try again.');
        setBackupCode('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Verification failed');
      setBackupCode('');
    } finally {
      setVerifying(false);
    }
  };

  // Format backup code as user types
  const handleBackupCodeChange = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Insert dash after 4 characters
    if (cleaned.length > 4) {
      setBackupCode(`${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`);
    } else {
      setBackupCode(cleaned);
    }
  };

  const displayError = error || localError;
  const isProcessing = verifying || isLoading;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {email ? (
            <>Verify your identity for <span className="font-medium">{email}</span></>
          ) : (
            'Enter your verification code to continue'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'totp' | 'backup')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="totp" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Key className="h-4 w-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>

          {/* Error Alert */}
          {displayError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {displayError}
                {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
                  <span className="block mt-1 text-xs">
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* TOTP Tab */}
          <TabsContent value="totp">
            <form onSubmit={handleTOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totp-code">6-Digit Code</Label>
                <Input
                  ref={inputRef}
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className={cn(
                    "text-center text-2xl tracking-[0.5em] font-mono",
                    displayError && "border-destructive"
                  )}
                  disabled={isProcessing}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the code from your authenticator app
                </p>
              </div>

              {/* Trust Device Checkbox */}
              {onTrustDevice && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trust-device"
                    checked={trustDevice}
                    onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
                  />
                  <Label
                    htmlFor="trust-device"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Trust this device for 30 days
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Backup Code Tab */}
          <TabsContent value="backup">
            <form onSubmit={handleBackupSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code">Backup Code</Label>
                <Input
                  ref={activeTab === 'backup' ? inputRef : undefined}
                  id="backup-code"
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={backupCode}
                  onChange={(e) => handleBackupCodeChange(e.target.value)}
                  className={cn(
                    "text-center text-xl tracking-widest font-mono uppercase",
                    displayError && "border-destructive"
                  )}
                  maxLength={9}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter one of your saved backup codes
                </p>
              </div>

              {/* Trust Device Checkbox */}
              {onTrustDevice && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trust-device-backup"
                    checked={trustDevice}
                    onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
                  />
                  <Label
                    htmlFor="trust-device-backup"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Trust this device for 30 days
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={backupCode.replace(/-/g, '').length !== 8 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Use Backup Code'
                )}
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Each backup code can only be used once. After using this code, it will be
                  invalidated.
                </AlertDescription>
              </Alert>
            </form>
          </TabsContent>
        </Tabs>

        {/* Cancel Button */}
        {onCancel && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel and Sign Out
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
