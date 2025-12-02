/**
 * Security Settings Panel
 * Admin interface for managing security policies and viewing lockouts
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Settings,
  Users,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAccountLockout } from '@/hooks/useAccountLockout';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function SecuritySettingsPanel() {
  const {
    securitySettings,
    isLoading,
    updateSecuritySettings,
    isUpdatingSettings,
    activeLockouts,
    lockoutsLoading,
    refetchLockouts,
    recentAttempts,
    attemptsLoading,
    unlockAccount,
    lockAccount,
    isUnlocking,
    isLocking,
    formatLockReason,
    getTimeUntilUnlock,
  } = useAccountLockout();

  const [showLockDialog, setShowLockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);
  const [lockDuration, setLockDuration] = useState('60');
  const [lockReason, setLockReason] = useState<'admin_action' | 'suspicious_activity'>('admin_action');
  const [searchQuery, setSearchQuery] = useState('');

  // Local settings state for form
  const [settings, setSettings] = useState({
    lockout_threshold: securitySettings?.lockout_threshold || 5,
    lockout_duration_minutes: securitySettings?.lockout_duration_minutes || 30,
    lockout_reset_minutes: securitySettings?.lockout_reset_minutes || 60,
    progressive_lockout: securitySettings?.progressive_lockout ?? true,
    mfa_required: securitySettings?.mfa_required ?? false,
    mfa_grace_period_hours: securitySettings?.mfa_grace_period_hours || 24,
    trusted_device_duration_days: securitySettings?.trusted_device_duration_days || 30,
    session_timeout_minutes: securitySettings?.session_timeout_minutes || 1440,
    max_concurrent_sessions: securitySettings?.max_concurrent_sessions || 5,
    require_reauth_for_sensitive: securitySettings?.require_reauth_for_sensitive ?? true,
  });

  // Update local settings when security settings load
  useState(() => {
    if (securitySettings) {
      setSettings({
        lockout_threshold: securitySettings.lockout_threshold || 5,
        lockout_duration_minutes: securitySettings.lockout_duration_minutes || 30,
        lockout_reset_minutes: securitySettings.lockout_reset_minutes || 60,
        progressive_lockout: securitySettings.progressive_lockout ?? true,
        mfa_required: securitySettings.mfa_required ?? false,
        mfa_grace_period_hours: securitySettings.mfa_grace_period_hours || 24,
        trusted_device_duration_days: securitySettings.trusted_device_duration_days || 30,
        session_timeout_minutes: securitySettings.session_timeout_minutes || 1440,
        max_concurrent_sessions: securitySettings.max_concurrent_sessions || 5,
        require_reauth_for_sensitive: securitySettings.require_reauth_for_sensitive ?? true,
      });
    }
  });

  // Save settings
  const handleSaveSettings = async () => {
    await updateSecuritySettings(settings);
  };

  // Unlock account
  const handleUnlock = async (userId: string) => {
    await unlockAccount(userId);
  };

  // Lock account
  const handleLock = async () => {
    if (!selectedUser) return;

    await lockAccount({
      userId: selectedUser.id,
      email: selectedUser.email,
      reason: lockReason,
      durationMinutes: parseInt(lockDuration),
    });

    setShowLockDialog(false);
    setSelectedUser(null);
  };

  // Filter login attempts by search
  const filteredAttempts = recentAttempts?.filter(attempt =>
    attempt.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="lockouts" className="gap-2">
            <Lock className="h-4 w-4" />
            Lockouts
            {activeLockouts && activeLockouts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {activeLockouts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="attempts" className="gap-2">
            <Users className="h-4 w-4" />
            Login Attempts
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          {/* Account Lockout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Lockout Policy
              </CardTitle>
              <CardDescription>
                Configure how accounts are locked after failed login attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lockout_threshold">Failed Attempts Before Lockout</Label>
                  <Input
                    id="lockout_threshold"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.lockout_threshold}
                    onChange={(e) => setSettings({ ...settings, lockout_threshold: parseInt(e.target.value) || 5 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of failed attempts before account is locked
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout_duration"
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.lockout_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, lockout_duration_minutes: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long the account stays locked
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout_reset">Reset Window (minutes)</Label>
                  <Input
                    id="lockout_reset"
                    type="number"
                    min={15}
                    max={1440}
                    value={settings.lockout_reset_minutes}
                    onChange={(e) => setSettings({ ...settings, lockout_reset_minutes: parseInt(e.target.value) || 60 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Failed attempt count resets after this time
                  </p>
                </div>

                <div className="space-y-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="progressive_lockout"
                      checked={settings.progressive_lockout}
                      onCheckedChange={(checked) => setSettings({ ...settings, progressive_lockout: checked })}
                    />
                    <Label htmlFor="progressive_lockout">Progressive Lockout</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Double lockout duration for repeat offenders within 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MFA Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Configure MFA requirements and trusted device settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="mfa_required"
                  checked={settings.mfa_required}
                  onCheckedChange={(checked) => setSettings({ ...settings, mfa_required: checked })}
                />
                <Label htmlFor="mfa_required">Require MFA for All Users</Label>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mfa_grace_period">MFA Grace Period (hours)</Label>
                  <Input
                    id="mfa_grace_period"
                    type="number"
                    min={1}
                    max={168}
                    value={settings.mfa_grace_period_hours}
                    onChange={(e) => setSettings({ ...settings, mfa_grace_period_hours: parseInt(e.target.value) || 24 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Time for new users to set up MFA when required
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trusted_device_duration">Trusted Device Duration (days)</Label>
                  <Input
                    id="trusted_device_duration"
                    type="number"
                    min={1}
                    max={90}
                    value={settings.trusted_device_duration_days}
                    onChange={(e) => setSettings({ ...settings, trusted_device_duration_days: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long a trusted device bypasses MFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Settings
              </CardTitle>
              <CardDescription>
                Configure session timeouts and concurrent session limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min={15}
                    max={10080}
                    value={settings.session_timeout_minutes}
                    onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) || 1440 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatic logout after inactivity (1440 = 24 hours)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_sessions">Max Concurrent Sessions</Label>
                  <Input
                    id="max_sessions"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.max_concurrent_sessions}
                    onChange={(e) => setSettings({ ...settings, max_concurrent_sessions: parseInt(e.target.value) || 5 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum active sessions per user
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="require_reauth"
                  checked={settings.require_reauth_for_sensitive}
                  onCheckedChange={(checked) => setSettings({ ...settings, require_reauth_for_sensitive: checked })}
                />
                <Label htmlFor="require_reauth">Require Re-authentication for Sensitive Operations</Label>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isUpdatingSettings}>
              {isUpdatingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* Lockouts Tab */}
        <TabsContent value="lockouts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Active Account Lockouts
                </span>
                <Button variant="outline" size="sm" onClick={() => refetchLockouts()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Accounts currently locked due to security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lockoutsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeLockouts && activeLockouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Locked At</TableHead>
                      <TableHead>Time Remaining</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLockouts.map((lockout) => (
                      <TableRow key={lockout.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lockout.profiles?.display_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{lockout.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lockout.lock_reason === 'admin_action' ? 'default' : 'destructive'}>
                            {formatLockReason(lockout.lock_reason)}
                          </Badge>
                          {lockout.failed_attempts > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {lockout.failed_attempts} failed attempts
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(lockout.locked_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {getTimeUntilUnlock(new Date(lockout.locked_until))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlock(lockout.user_id)}
                            disabled={isUnlocking}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>No active lockouts</p>
                  <p className="text-sm">All accounts are accessible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Attempts Tab */}
        <TabsContent value="attempts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Login Attempts
              </CardTitle>
              <CardDescription>
                View recent authentication attempts across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {attemptsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAttempts && filteredAttempts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttempts.slice(0, 50).map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">
                          {attempt.email}
                        </TableCell>
                        <TableCell>
                          {attempt.success ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.failure_reason || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {attempt.ip_address || '-'}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No login attempts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lock Account Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Account</DialogTitle>
            <DialogDescription>
              Manually lock this user's account
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You are about to lock the account for {selectedUser.email}.
                  They will not be able to sign in until unlocked.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Lock Duration</Label>
                <Select value={lockDuration} onValueChange={setLockDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="720">12 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                    <SelectItem value="10080">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={lockReason} onValueChange={(v: any) => setLockReason(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_action">Admin Action</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLock} disabled={isLocking}>
              {isLocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lock Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
