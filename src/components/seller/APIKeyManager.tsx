/**
 * API Key Manager Component
 * UI for creating, viewing, and managing API keys
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import { useAPIKeys, API_SCOPES, type APIScope, type CreateAPIKeyResult } from '@/hooks/useAPIKeys';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function APIKeyManager() {
  const {
    apiKeys,
    isLoading,
    createKey,
    revokeKey,
    isCreating,
    isRevoking,
    getKeyStatus,
    formatScope,
  } = useAPIKeys();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<CreateAPIKeyResult | null>(null);
  const [showRawKey, setShowRawKey] = useState(false);

  // Create key form state
  const [keyName, setKeyName] = useState('');
  const [keyDescription, setKeyDescription] = useState('');
  const [keyEnvironment, setKeyEnvironment] = useState<'production' | 'test' | 'development'>('production');
  const [selectedScopes, setSelectedScopes] = useState<APIScope[]>(['read:listings']);

  const handleCreateKey = async () => {
    try {
      const result = await createKey({
        name: keyName,
        description: keyDescription || undefined,
        environment: keyEnvironment,
        scopes: selectedScopes,
      });

      setNewKeyResult(result);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeKey(keyId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const resetForm = () => {
    setKeyName('');
    setKeyDescription('');
    setKeyEnvironment('production');
    setSelectedScopes(['read:listings']);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleScope = (scope: APIScope) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </span>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    API keys allow server-to-server access to your data.
                    Keep your keys secure and never share them publicly.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name *</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production Server"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key-description">Description</Label>
                    <Textarea
                      id="key-description"
                      placeholder="What is this key used for?"
                      value={keyDescription}
                      onChange={(e) => setKeyDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select value={keyEnvironment} onValueChange={(v: any) => setKeyEnvironment(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(Object.entries(API_SCOPES) as [APIScope, string][]).map(([scope, description]) => (
                        <div
                          key={scope}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={scope}
                            checked={selectedScopes.includes(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                          />
                          <label
                            htmlFor={scope}
                            className="text-sm cursor-pointer"
                          >
                            {description}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={!keyName || selectedScopes.length === 0 || isCreating}
                  >
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage API keys for programmatic access to your store data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">Create your first API key to enable integrations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => {
                  const status = getKeyStatus(key);
                  return (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{key.name}</p>
                          {key.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {key.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {key.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {key.environment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status === 'active' ? 'default' : 'destructive'}
                          className="gap-1"
                        >
                          {status === 'active' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {key.last_used_at ? (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {status === 'active' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke "{key.name}"? This action cannot
                                  be undone and any applications using this key will stop working.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevokeKey(key.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Revoke Key
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Key Created Dialog */}
      <Dialog open={!!newKeyResult} onOpenChange={() => setNewKeyResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Your API key has been created. Make sure to copy it now - you won't be able to see
              it again!
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is the only time you'll see this key. Store it securely.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  type={showRawKey ? 'text' : 'password'}
                  value={newKeyResult?.rawKey || ''}
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRawKey(!showRawKey)}
                >
                  {showRawKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => newKeyResult && copyToClipboard(newKeyResult.rawKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setNewKeyResult(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
