/**
 * MFA Settings Component
 * Handles TOTP setup, backup codes, and trusted devices
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Shield,
  Smartphone,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Monitor,
  Loader2,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { cn } from '@/lib/utils';

export function MFASettings() {
  const {
    mfaSettings,
    trustedDevices,
    backupCodesInfo,
    pendingSecret,
    pendingBackupCodes,
    isLoading,
    isMFAEnabled,
    initializeTOTP,
    enableTOTP,
    disableMFA,
    isEnabling,
    isDisabling,
    regenerateBackupCodes,
    isRegenerating,
    removeTrustedDevice,
    isCurrentDeviceTrusted,
    clearPendingData,
  } = useMFA();

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [qrData, setQrData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verifyError, setVerifyError] = useState('');

  // Start MFA setup
  const handleStartSetup = () => {
    const data = initializeTOTP();
    setQrData(data);
    setSetupStep('qr');
    setVerificationCode('');
    setVerifyError('');
    setShowSetupDialog(true);
  };

  // Verify and enable TOTP
  const handleVerifyAndEnable = async () => {
    if (!qrData?.secret || verificationCode.length !== 6) return;

    setVerifyError('');
    try {
      await enableTOTP({ secret: qrData.secret, code: verificationCode });
      setSetupStep('backup');
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  // Disable MFA
  const handleDisableMFA = async () => {
    if (!disablePassword) return;

    try {
      await disableMFA({ password: disablePassword });
      setShowDisableDialog(false);
      setDisablePassword('');
    } catch (error) {
      // Error handled by useMFA hook
    }
  };

  // Copy secret to clipboard
  const handleCopySecret = async () => {
    if (!qrData?.secret) return;
    await navigator.clipboard.writeText(qrData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy backup codes
  const handleCopyBackupCodes = async () => {
    const codes = pendingBackupCodes.join('\n');
    await navigator.clipboard.writeText(codes);
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  // Download backup codes as text file
  const handleDownloadBackupCodes = () => {
    const content = `CraftLocal Backup Codes
Generated: ${new Date().toLocaleString()}

These codes can be used to access your account if you lose your authenticator.
Each code can only be used once.

${pendingBackupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

Keep these codes in a safe place!`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'craftlocal-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Close setup dialog
  const handleCloseSetup = () => {
    setShowSetupDialog(false);
    clearPendingData();
    setQrData(null);
    setSetupStep('qr');
    setVerificationCode('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MFA Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isMFAEnabled ? "bg-green-100 dark:bg-green-900" : "bg-muted"
              )}>
                <Smartphone className={cn(
                  "h-5 w-5",
                  isMFAEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  {isMFAEnabled
                    ? 'Use your authenticator app to generate verification codes'
                    : 'Use an app like Google Authenticator or 1Password'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isMFAEnabled ? 'default' : 'secondary'}>
                {isMFAEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {isMFAEnabled ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                >
                  Disable
                </Button>
              ) : (
                <Button size="sm" onClick={handleStartSetup}>
                  Set Up
                </Button>
              )}
            </div>
          </div>

          {!isMFAEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Protect Your Account</AlertTitle>
              <AlertDescription>
                Two-factor authentication adds an extra layer of security by requiring a
                verification code from your phone in addition to your password.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Card (only shown when MFA is enabled) */}
      {isMFAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Backup Codes
            </CardTitle>
            <CardDescription>
              Recovery codes for when you don't have your authenticator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {backupCodesInfo?.unused || 0} of {backupCodesInfo?.total || 10} codes remaining
                </p>
                <p className="text-sm text-muted-foreground">
                  Each code can only be used once
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBackupCodesDialog(true)}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>

            {backupCodesInfo && backupCodesInfo.unused <= 2 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Low Backup Codes</AlertTitle>
                <AlertDescription>
                  You're running low on backup codes. Consider regenerating them to ensure you
                  can always access your account.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trusted Devices Card */}
      {isMFAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Trusted Devices
            </CardTitle>
            <CardDescription>
              Devices where you won't need to enter a verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trustedDevices && trustedDevices.length > 0 ? (
              <div className="space-y-3">
                {trustedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {device.device_name || 'Unknown Device'}
                          {isCurrentDeviceTrusted() && device.device_fingerprint && (
                            <Badge variant="outline" className="ml-2">Current</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last used: {new Date(device.last_used_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTrustedDevice(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trusted devices. You can trust a device during MFA verification.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === 'qr' && 'Set Up Two-Factor Authentication'}
              {setupStep === 'verify' && 'Verify Setup'}
              {setupStep === 'backup' && 'Save Backup Codes'}
            </DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && 'Scan the QR code with your authenticator app'}
              {setupStep === 'verify' && 'Enter the 6-digit code from your authenticator app'}
              {setupStep === 'backup' && 'Save these codes in a safe place'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && qrData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qrCodeUrl)}`}
                  alt="QR Code for authenticator app"
                  className="w-48 h-48"
                />
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Can't scan? Enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {qrData.secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopySecret}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseSetup}>
                  Cancel
                </Button>
                <Button onClick={() => setSetupStep('verify')}>
                  Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
                {verifyError && (
                  <p className="text-sm text-destructive">{verifyError}</p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSetupStep('qr')}>
                  Back
                </Button>
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={verificationCode.length !== 6 || isEnabling}
                >
                  {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === 'backup' && pendingBackupCodes.length > 0 && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Save these codes!</AlertTitle>
                <AlertDescription>
                  If you lose access to your authenticator, you'll need one of these codes to
                  sign in. Each code can only be used once.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {pendingBackupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleCopyBackupCodes}>
                  {copiedBackupCodes ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownloadBackupCodes}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <DialogFooter>
                <Button onClick={handleCloseSetup}>
                  I've Saved My Codes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will remove the extra security from your account. Enter your password to
              confirm.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Disabling 2FA makes your account more vulnerable to unauthorized access.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="disable-password">Password</Label>
            <div className="relative">
              <Input
                id="disable-password"
                type={showPassword ? 'text' : 'password'}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMFA}
              disabled={!disablePassword || isDisabling}
            >
              {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              This will invalidate all existing backup codes and generate new ones.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Existing codes will be invalidated</AlertTitle>
            <AlertDescription>
              Any backup codes you haven't used yet will stop working. Make sure to save the new
              codes in a safe place.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupCodesDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await regenerateBackupCodes();
                setShowBackupCodesDialog(false);
                // The backup codes dialog will show via pendingBackupCodes
                setShowSetupDialog(true);
                setSetupStep('backup');
              }}
              disabled={isRegenerating}
            >
              {isRegenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Regenerate Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
