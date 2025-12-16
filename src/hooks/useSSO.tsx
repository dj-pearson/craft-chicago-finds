/**
 * Single Sign-On (SSO) Hook
 * Manages SAML and OIDC provider configuration and authentication
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SSOProvider {
  id: string;
  name: string;
  slug: string;
  provider_type: 'saml' | 'oidc';
  display_name: string;
  is_enabled: boolean;
  is_enterprise: boolean;
  icon_url: string | null;

  // SAML Configuration
  saml_entity_id: string | null;
  saml_sso_url: string | null;
  saml_certificate: string | null;
  saml_metadata_url: string | null;

  // OIDC Configuration
  oidc_client_id: string | null;
  oidc_client_secret: string | null;
  oidc_authorization_url: string | null;
  oidc_token_url: string | null;
  oidc_userinfo_url: string | null;
  oidc_jwks_url: string | null;
  oidc_scopes: string[];

  // Attribute Mapping
  attribute_mapping: Record<string, string>;

  // Domain restrictions
  allowed_domains: string[] | null;
  auto_create_users: boolean;
  default_role: string;

  created_at: string;
  updated_at: string;
}

interface SSOUserLink {
  id: string;
  user_id: string;
  provider_id: string;
  external_id: string;
  external_email: string | null;
  external_name: string | null;
  attributes: Record<string, any>;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSSOProviderInput {
  name: string;
  slug: string;
  provider_type: 'saml' | 'oidc';
  display_name: string;
  is_enterprise?: boolean;
  icon_url?: string;

  // SAML fields
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_certificate?: string;
  saml_metadata_url?: string;

  // OIDC fields
  oidc_client_id?: string;
  oidc_client_secret?: string;
  oidc_authorization_url?: string;
  oidc_token_url?: string;
  oidc_userinfo_url?: string;
  oidc_jwks_url?: string;
  oidc_scopes?: string[];

  // Optional
  attribute_mapping?: Record<string, string>;
  allowed_domains?: string[];
  auto_create_users?: boolean;
  default_role?: string;
}

// Standard OIDC provider configurations
export const STANDARD_OIDC_PROVIDERS: Record<string, Partial<CreateSSOProviderInput>> = {
  google: {
    name: 'Google',
    slug: 'google',
    display_name: 'Google',
    provider_type: 'oidc',
    oidc_authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth',
    oidc_token_url: 'https://oauth2.googleapis.com/token',
    oidc_userinfo_url: 'https://openidconnect.googleapis.com/v1/userinfo',
    oidc_jwks_url: 'https://www.googleapis.com/oauth2/v3/certs',
    oidc_scopes: ['openid', 'email', 'profile'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
      picture: 'picture',
    },
  },
  microsoft: {
    name: 'Microsoft',
    slug: 'microsoft',
    display_name: 'Microsoft',
    provider_type: 'oidc',
    oidc_authorization_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    oidc_token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    oidc_userinfo_url: 'https://graph.microsoft.com/oidc/userinfo',
    oidc_jwks_url: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    oidc_scopes: ['openid', 'email', 'profile'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
    },
  },
  okta: {
    name: 'Okta',
    slug: 'okta',
    display_name: 'Okta',
    provider_type: 'oidc',
    is_enterprise: true,
    oidc_scopes: ['openid', 'email', 'profile'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
    },
  },
  auth0: {
    name: 'Auth0',
    slug: 'auth0',
    display_name: 'Auth0',
    provider_type: 'oidc',
    is_enterprise: true,
    oidc_scopes: ['openid', 'email', 'profile'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
    },
  },
};

export function useSSO() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all enabled SSO providers (public)
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['sso-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_providers')
        .select('*')
        .eq('is_enabled', true)
        .order('display_name');

      if (error) {
        console.error('Error fetching SSO providers:', error);
        throw error;
      }

      return data as SSOProvider[];
    },
  });

  // Fetch all SSO providers (admin only)
  const { data: allProviders, isLoading: allProvidersLoading, refetch: refetchProviders } = useQuery({
    queryKey: ['sso-providers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_providers')
        .select('*')
        .order('display_name');

      if (error) {
        console.error('Error fetching all SSO providers:', error);
        throw error;
      }

      return data as SSOProvider[];
    },
    enabled: !!user,
  });

  // Fetch user's SSO links
  const { data: userLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['sso-user-links', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('sso_user_links')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching SSO user links:', error);
        throw error;
      }

      return data as SSOUserLink[];
    },
    enabled: !!user?.id,
  });

  // Create SSO provider (admin only)
  const createProvider = useMutation({
    mutationFn: async (input: CreateSSOProviderInput) => {
      const { data, error } = await supabase
        .from('sso_providers')
        .insert({
          ...input,
          is_enabled: false, // Start disabled
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: 'sso_provider_created',
          event_category: 'sso',
          event_details: { provider_name: input.name, provider_type: input.provider_type },
          severity: 'info',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      queryClient.invalidateQueries({ queryKey: ['sso-providers-all'] });
      toast({
        title: 'SSO Provider Created',
        description: 'The SSO provider has been created. You can now configure and enable it.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create SSO provider',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update SSO provider (admin only)
  const updateProvider = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SSOProvider> & { id: string }) => {
      const { data, error } = await supabase
        .from('sso_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: 'sso_provider_updated',
          event_category: 'sso',
          event_details: { provider_id: id, updates: Object.keys(updates) },
          severity: 'info',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      queryClient.invalidateQueries({ queryKey: ['sso-providers-all'] });
      toast({
        title: 'SSO Provider Updated',
        description: 'The SSO provider configuration has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update SSO provider',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Enable/Disable SSO provider (admin only)
  const toggleProvider = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('sso_providers')
        .update({ is_enabled: enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: enabled ? 'sso_provider_enabled' : 'sso_provider_disabled',
          event_category: 'sso',
          event_details: { provider_id: id },
          severity: 'warning',
        });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      queryClient.invalidateQueries({ queryKey: ['sso-providers-all'] });
      toast({
        title: data.is_enabled ? 'SSO Provider Enabled' : 'SSO Provider Disabled',
        description: `${data.display_name} has been ${data.is_enabled ? 'enabled' : 'disabled'}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to toggle SSO provider',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete SSO provider (admin only)
  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      // Get provider info first for logging
      const { data: provider } = await supabase
        .from('sso_providers')
        .select('name')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('sso_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: 'sso_provider_deleted',
          event_category: 'sso',
          event_details: { provider_id: id, provider_name: provider?.name },
          severity: 'warning',
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      queryClient.invalidateQueries({ queryKey: ['sso-providers-all'] });
      toast({
        title: 'SSO Provider Deleted',
        description: 'The SSO provider has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete SSO provider',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Initiate SSO login
  const initiateLogin = async (providerSlug: string, redirectTo?: string) => {
    const provider = providers?.find(p => p.slug === providerSlug);
    if (!provider) {
      toast({
        title: 'SSO Provider not found',
        description: 'The selected SSO provider is not available.',
        variant: 'destructive',
      });
      return;
    }

    // For built-in Supabase OAuth providers (google, apple, etc.)
    const builtInProviders = ['google', 'apple', 'github', 'azure', 'gitlab', 'bitbucket'];
    if (builtInProviders.includes(providerSlug)) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerSlug as any,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: 'SSO Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    // For custom OIDC/SAML providers
    if (provider.provider_type === 'oidc' && provider.oidc_authorization_url && provider.oidc_client_id) {
      // Build OIDC authorization URL
      const state = crypto.randomUUID();
      const nonce = crypto.randomUUID();

      // Store state for verification
      sessionStorage.setItem('sso_state', state);
      sessionStorage.setItem('sso_nonce', nonce);
      sessionStorage.setItem('sso_provider', provider.id);
      sessionStorage.setItem('sso_redirect', redirectTo || '/');

      const params = new URLSearchParams({
        client_id: provider.oidc_client_id,
        response_type: 'code',
        scope: provider.oidc_scopes?.join(' ') || 'openid email profile',
        redirect_uri: `${window.location.origin}/auth/sso/callback`,
        state,
        nonce,
      });

      window.location.href = `${provider.oidc_authorization_url}?${params.toString()}`;
      return;
    }

    if (provider.provider_type === 'saml' && provider.saml_sso_url) {
      // For SAML, we would typically redirect to an IdP-initiated or SP-initiated flow
      // This would need a backend endpoint to handle SAML request generation
      toast({
        title: 'SAML Login',
        description: 'SAML login requires backend configuration. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'SSO Configuration Incomplete',
      description: 'This SSO provider is not fully configured.',
      variant: 'destructive',
    });
  };

  // Link user to SSO provider
  const linkProvider = useMutation({
    mutationFn: async ({ providerId, externalId, externalEmail, externalName, attributes }: {
      providerId: string;
      externalId: string;
      externalEmail?: string;
      externalName?: string;
      attributes?: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sso_user_links')
        .upsert({
          user_id: user.id,
          provider_id: providerId,
          external_id: externalId,
          external_email: externalEmail,
          external_name: externalName,
          attributes: attributes || {},
        }, {
          onConflict: 'provider_id,external_id',
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'sso_link_created',
          event_category: 'sso',
          event_details: { provider_id: providerId },
          severity: 'info',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-user-links'] });
      toast({
        title: 'Account Linked',
        description: 'Your account has been linked to the SSO provider.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to link account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unlink user from SSO provider
  const unlinkProvider = useMutation({
    mutationFn: async (linkId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get link info for logging
      const { data: link } = await supabase
        .from('sso_user_links')
        .select('provider_id')
        .eq('id', linkId)
        .single();

      const { error } = await supabase
        .from('sso_user_links')
        .delete()
        .eq('id', linkId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'sso_link_removed',
          event_category: 'sso',
          event_details: { provider_id: link?.provider_id },
          severity: 'info',
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-user-links'] });
      toast({
        title: 'Account Unlinked',
        description: 'The SSO provider has been unlinked from your account.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to unlink account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check if email domain is allowed for enterprise SSO
  const checkDomainRestriction = (email: string, provider: SSOProvider): boolean => {
    if (!provider.allowed_domains || provider.allowed_domains.length === 0) {
      return true; // No domain restriction
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    return provider.allowed_domains.some(
      domain => emailDomain === domain.toLowerCase()
    );
  };

  // Get provider by slug
  const getProviderBySlug = (slug: string): SSOProvider | undefined => {
    return providers?.find(p => p.slug === slug);
  };

  // Get enterprise providers for a domain
  const getEnterpriseProvidersForDomain = (email: string): SSOProvider[] => {
    if (!providers) return [];

    return providers.filter(p => {
      if (!p.is_enterprise) return false;
      return checkDomainRestriction(email, p);
    });
  };

  return {
    // Data
    providers,
    allProviders,
    userLinks,
    isLoading: providersLoading || linksLoading,
    isAdminLoading: allProvidersLoading,

    // Provider Management (admin)
    createProvider: createProvider.mutateAsync,
    updateProvider: updateProvider.mutateAsync,
    toggleProvider: toggleProvider.mutateAsync,
    deleteProvider: deleteProvider.mutateAsync,
    isCreating: createProvider.isPending,
    isUpdating: updateProvider.isPending,
    isDeleting: deleteProvider.isPending,
    refetchProviders,

    // User Actions
    initiateLogin,
    linkProvider: linkProvider.mutateAsync,
    unlinkProvider: unlinkProvider.mutateAsync,
    isLinking: linkProvider.isPending,
    isUnlinking: unlinkProvider.isPending,

    // Utilities
    checkDomainRestriction,
    getProviderBySlug,
    getEnterpriseProvidersForDomain,
    STANDARD_OIDC_PROVIDERS,
  };
}

export type { SSOProvider, SSOUserLink, CreateSSOProviderInput };
