/**
 * API Keys Management Hook
 * Provides functionality for creating, managing, and revoking API keys
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Available API scopes with descriptions
 */
export const API_SCOPES = {
  'read:listings': 'Read product listings',
  'write:listings': 'Create and update listings',
  'delete:listings': 'Delete listings',
  'read:orders': 'Read order information',
  'write:orders': 'Update order status',
  'read:profile': 'Read user profile',
  'write:profile': 'Update user profile',
  'read:analytics': 'Access analytics data',
  'read:inventory': 'Read inventory levels',
  'write:inventory': 'Update inventory',
} as const;

export type APIScope = keyof typeof API_SCOPES;

/**
 * API Key interface
 */
export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  description: string | null;
  environment: 'production' | 'test' | 'development';
  is_active: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  last_used_at: string | null;
  usage_count: number;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  created_at: string;
}

/**
 * API Key creation parameters
 */
export interface CreateAPIKeyParams {
  name: string;
  scopes?: APIScope[];
  description?: string;
  environment?: 'production' | 'test' | 'development';
  expiresAt?: Date | null;
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}

/**
 * API Key creation result (includes raw key - only shown once)
 */
export interface CreateAPIKeyResult {
  id: string;
  rawKey: string;
  keyPrefix: string;
}

/**
 * API Key usage log entry
 */
export interface APIKeyUsageLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  response_time_ms: number | null;
  ip_address: string | null;
  created_at: string;
  error_code: string | null;
  error_message: string | null;
}

export function useAPIKeys() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all API keys for the current user
  const {
    data: apiKeys,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as APIKey[];
    },
    enabled: !!user,
  });

  // Create a new API key
  const createKeyMutation = useMutation({
    mutationFn: async (params: CreateAPIKeyParams): Promise<CreateAPIKeyResult> => {
      const { data, error } = await supabase.rpc('create_api_key', {
        key_name: params.name,
        key_scopes: params.scopes || ['read:listings'],
        key_description: params.description || null,
        key_environment: params.environment || 'production',
        key_expires_at: params.expiresAt?.toISOString() || null,
        key_rate_limit_minute: params.rateLimitPerMinute || 60,
        key_rate_limit_day: params.rateLimitPerDay || 10000,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Failed to create API key');

      const result = data[0];
      return {
        id: result.api_key_id,
        rawKey: result.raw_key,
        keyPrefix: result.key_prefix,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  // Revoke an API key
  const revokeKeyMutation = useMutation({
    mutationFn: async ({ keyId, reason }: { keyId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('revoke_api_key', {
        target_key_id: keyId,
        revoke_reason: reason || 'User revoked',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke API key: ${error.message}`);
    },
  });

  // Update API key (name, description, scopes, rate limits)
  const updateKeyMutation = useMutation({
    mutationFn: async ({
      keyId,
      updates,
    }: {
      keyId: string;
      updates: Partial<{
        name: string;
        description: string;
        scopes: string[];
        rate_limit_per_minute: number;
        rate_limit_per_day: number;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', keyId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update API key: ${error.message}`);
    },
  });

  // Fetch usage logs for a specific API key
  const fetchUsageLogs = async (keyId: string, limit = 50): Promise<APIKeyUsageLog[]> => {
    const { data, error } = await supabase
      .from('api_key_usage_log')
      .select('*')
      .eq('api_key_id', keyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as APIKeyUsageLog[];
  };

  // Get usage statistics for a specific API key
  const getUsageStats = async (keyId: string) => {
    const { data: usageData, error: usageError } = await supabase
      .from('api_key_usage_log')
      .select('*')
      .eq('api_key_id', keyId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (usageError) throw usageError;

    const totalRequests = usageData?.length || 0;
    const successfulRequests = usageData?.filter(log => log.status_code && log.status_code < 400).length || 0;
    const failedRequests = totalRequests - successfulRequests;
    const avgResponseTime = usageData?.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / (totalRequests || 1);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
    };
  };

  // Format scope for display
  const formatScope = (scope: string): string => {
    return API_SCOPES[scope as APIScope] || scope;
  };

  // Check if a key is expired
  const isExpired = (key: APIKey): boolean => {
    if (!key.expires_at) return false;
    return new Date(key.expires_at) < new Date();
  };

  // Get key status
  const getKeyStatus = (key: APIKey): 'active' | 'revoked' | 'expired' => {
    if (!key.is_active || key.revoked_at) return 'revoked';
    if (isExpired(key)) return 'expired';
    return 'active';
  };

  return {
    // Data
    apiKeys: apiKeys || [],
    isLoading,
    error,

    // Actions
    createKey: createKeyMutation.mutateAsync,
    revokeKey: (keyId: string, reason?: string) =>
      revokeKeyMutation.mutateAsync({ keyId, reason }),
    updateKey: (keyId: string, updates: Parameters<typeof updateKeyMutation.mutateAsync>[0]['updates']) =>
      updateKeyMutation.mutateAsync({ keyId, updates }),
    refetch,

    // Usage
    fetchUsageLogs,
    getUsageStats,

    // Helpers
    formatScope,
    isExpired,
    getKeyStatus,
    API_SCOPES,

    // Mutation states
    isCreating: createKeyMutation.isPending,
    isRevoking: revokeKeyMutation.isPending,
    isUpdating: updateKeyMutation.isPending,
  };
}
