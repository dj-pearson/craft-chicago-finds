/**
 * SSO Provider Manager Component
 * Admin interface for managing SSO/OIDC providers
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  KeyRound,
  Plus,
  Trash2,
  Edit,
  Shield,
  Building2,
  Globe,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useSSO, type SSOProvider, type CreateSSOProviderInput, STANDARD_OIDC_PROVIDERS } from '@/hooks/useSSO';
import { cn } from '@/lib/utils';

export function SSOProviderManager() {
  const {
    allProviders,
    isAdminLoading,
    createProvider,
    updateProvider,
    toggleProvider,
    deleteProvider,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSSO();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSSOProviderInput>({
    name: '',
    slug: '',
    provider_type: 'oidc',
    display_name: '',
    is_enterprise: false,
    oidc_scopes: ['openid', 'email', 'profile'],
    auto_create_users: true,
    default_role: 'buyer',
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      provider_type: 'oidc',
      display_name: '',
      is_enterprise: false,
      oidc_scopes: ['openid', 'email', 'profile'],
      auto_create_users: true,
      default_role: 'buyer',
    });
  };

  // Open create dialog with standard provider template
  const handleCreateFromTemplate = (template: keyof typeof STANDARD_OIDC_PROVIDERS) => {
    const config = STANDARD_OIDC_PROVIDERS[template];
    setFormData({
      ...formData,
      ...config,
      name: config.name || '',
      slug: config.slug || '',
      display_name: config.display_name || '',
      provider_type: config.provider_type || 'oidc',
    });
    setShowCreateDialog(true);
  };

  // Open edit dialog
  const handleEdit = (provider: SSOProvider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      slug: provider.slug,
      provider_type: provider.provider_type,
      display_name: provider.display_name,
      is_enterprise: provider.is_enterprise,
      icon_url: provider.icon_url || undefined,
      saml_entity_id: provider.saml_entity_id || undefined,
      saml_sso_url: provider.saml_sso_url || undefined,
      saml_certificate: provider.saml_certificate || undefined,
      saml_metadata_url: provider.saml_metadata_url || undefined,
      oidc_client_id: provider.oidc_client_id || undefined,
      oidc_client_secret: provider.oidc_client_secret || undefined,
      oidc_authorization_url: provider.oidc_authorization_url || undefined,
      oidc_token_url: provider.oidc_token_url || undefined,
      oidc_userinfo_url: provider.oidc_userinfo_url || undefined,
      oidc_jwks_url: provider.oidc_jwks_url || undefined,
      oidc_scopes: provider.oidc_scopes || ['openid', 'email', 'profile'],
      attribute_mapping: provider.attribute_mapping || {},
      allowed_domains: provider.allowed_domains || undefined,
      auto_create_users: provider.auto_create_users,
      default_role: provider.default_role,
    });
    setShowEditDialog(true);
  };

  // Create provider
  const handleCreate = async () => {
    try {
      await createProvider(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Update provider
  const handleUpdate = async () => {
    if (!selectedProvider) return;

    try {
      await updateProvider({ id: selectedProvider.id, ...formData });
      setShowEditDialog(false);
      setSelectedProvider(null);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Delete provider
  const handleDelete = async () => {
    if (!selectedProvider) return;

    try {
      await deleteProvider(selectedProvider.id);
      setShowDeleteDialog(false);
      setSelectedProvider(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Toggle provider
  const handleToggle = async (provider: SSOProvider) => {
    await toggleProvider({ id: provider.id, enabled: !provider.is_enabled });
  };

  // Copy callback URL
  const handleCopyCallback = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/auth/sso/callback`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SSO Providers</h2>
          <p className="text-muted-foreground">
            Configure enterprise single sign-on providers
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Quick Add Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Setup</CardTitle>
          <CardDescription>
            Add a pre-configured SSO provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleCreateFromTemplate('google')}>
              <Globe className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" onClick={() => handleCreateFromTemplate('microsoft')}>
              <Building2 className="mr-2 h-4 w-4" />
              Microsoft
            </Button>
            <Button variant="outline" onClick={() => handleCreateFromTemplate('okta')}>
              <Shield className="mr-2 h-4 w-4" />
              Okta
            </Button>
            <Button variant="outline" onClick={() => handleCreateFromTemplate('auth0')}>
              <KeyRound className="mr-2 h-4 w-4" />
              Auth0
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Callback URL */}
      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Callback URL:</strong> {window.location.origin}/auth/sso/callback
          </span>
          <Button variant="ghost" size="sm" onClick={handleCopyCallback}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </AlertDescription>
      </Alert>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {allProviders && allProviders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enterprise</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {provider.icon_url ? (
                          <img src={provider.icon_url} alt="" className="h-5 w-5" />
                        ) : (
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{provider.display_name}</p>
                          <p className="text-xs text-muted-foreground">{provider.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {provider.provider_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={provider.is_enabled}
                        onCheckedChange={() => handleToggle(provider)}
                      />
                    </TableCell>
                    <TableCell>
                      {provider.is_enterprise && (
                        <Badge variant="secondary">Enterprise</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SSO providers configured</p>
              <p className="text-sm">Add a provider to enable enterprise sign-on</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedProvider(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit SSO Provider' : 'Add SSO Provider'}
            </DialogTitle>
            <DialogDescription>
              Configure the SSO provider settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: showCreateDialog ? generateSlug(e.target.value) : formData.slug,
                      });
                    }}
                    placeholder="My Company SSO"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    placeholder="my-company-sso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Sign in with My Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider_type">Provider Type</Label>
                  <Select
                    value={formData.provider_type}
                    onValueChange={(value: 'saml' | 'oidc') => setFormData({ ...formData, provider_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oidc">OIDC (OpenID Connect)</SelectItem>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enterprise"
                  checked={formData.is_enterprise}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enterprise: checked })}
                />
                <Label htmlFor="is_enterprise">Enterprise Provider</Label>
              </div>
            </div>

            <Separator />

            {/* OIDC Configuration */}
            {formData.provider_type === 'oidc' && (
              <div className="space-y-4">
                <h4 className="font-medium">OIDC Configuration</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oidc_client_id">Client ID</Label>
                    <Input
                      id="oidc_client_id"
                      value={formData.oidc_client_id || ''}
                      onChange={(e) => setFormData({ ...formData, oidc_client_id: e.target.value })}
                      placeholder="your-client-id"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oidc_client_secret">Client Secret</Label>
                    <Input
                      id="oidc_client_secret"
                      type="password"
                      value={formData.oidc_client_secret || ''}
                      onChange={(e) => setFormData({ ...formData, oidc_client_secret: e.target.value })}
                      placeholder="your-client-secret"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oidc_authorization_url">Authorization URL</Label>
                  <Input
                    id="oidc_authorization_url"
                    value={formData.oidc_authorization_url || ''}
                    onChange={(e) => setFormData({ ...formData, oidc_authorization_url: e.target.value })}
                    placeholder="https://provider.com/oauth2/authorize"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oidc_token_url">Token URL</Label>
                  <Input
                    id="oidc_token_url"
                    value={formData.oidc_token_url || ''}
                    onChange={(e) => setFormData({ ...formData, oidc_token_url: e.target.value })}
                    placeholder="https://provider.com/oauth2/token"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oidc_userinfo_url">UserInfo URL (optional)</Label>
                  <Input
                    id="oidc_userinfo_url"
                    value={formData.oidc_userinfo_url || ''}
                    onChange={(e) => setFormData({ ...formData, oidc_userinfo_url: e.target.value })}
                    placeholder="https://provider.com/oauth2/userinfo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oidc_scopes">Scopes (comma-separated)</Label>
                  <Input
                    id="oidc_scopes"
                    value={formData.oidc_scopes?.join(', ') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      oidc_scopes: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })}
                    placeholder="openid, email, profile"
                  />
                </div>
              </div>
            )}

            {/* SAML Configuration */}
            {formData.provider_type === 'saml' && (
              <div className="space-y-4">
                <h4 className="font-medium">SAML Configuration</h4>

                <div className="space-y-2">
                  <Label htmlFor="saml_entity_id">Entity ID (Issuer)</Label>
                  <Input
                    id="saml_entity_id"
                    value={formData.saml_entity_id || ''}
                    onChange={(e) => setFormData({ ...formData, saml_entity_id: e.target.value })}
                    placeholder="https://idp.example.com/entity-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saml_sso_url">SSO URL</Label>
                  <Input
                    id="saml_sso_url"
                    value={formData.saml_sso_url || ''}
                    onChange={(e) => setFormData({ ...formData, saml_sso_url: e.target.value })}
                    placeholder="https://idp.example.com/sso"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saml_metadata_url">Metadata URL (optional)</Label>
                  <Input
                    id="saml_metadata_url"
                    value={formData.saml_metadata_url || ''}
                    onChange={(e) => setFormData({ ...formData, saml_metadata_url: e.target.value })}
                    placeholder="https://idp.example.com/metadata"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saml_certificate">X.509 Certificate</Label>
                  <Textarea
                    id="saml_certificate"
                    value={formData.saml_certificate || ''}
                    onChange={(e) => setFormData({ ...formData, saml_certificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={4}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Access Control */}
            <div className="space-y-4">
              <h4 className="font-medium">Access Control</h4>

              <div className="space-y-2">
                <Label htmlFor="allowed_domains">Allowed Domains (optional)</Label>
                <Input
                  id="allowed_domains"
                  value={formData.allowed_domains?.join(', ') || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    allowed_domains: e.target.value
                      ? e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      : undefined,
                  })}
                  placeholder="example.com, company.org"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow all domains
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_create_users"
                  checked={formData.auto_create_users}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_create_users: checked })}
                />
                <Label htmlFor="auto_create_users">Auto-create users on first login</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_role">Default Role</Label>
                <Select
                  value={formData.default_role}
                  onValueChange={(value) => setFormData({ ...formData, default_role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              setSelectedProvider(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating || !formData.name || !formData.slug}
            >
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showEditDialog ? 'Save Changes' : 'Create Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SSO Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProvider?.display_name}"?
              This will remove the SSO configuration and all user links.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertDescription>
              Users who sign in exclusively through this provider will no longer be able to access their accounts.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
