import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface EmailDigestPreference {
  digest_type: string;
  frequency: string;
  last_sent_at: string | null;
  is_active: boolean;
}

interface EmailDigestDbRow {
  id: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'never';
  categories: string[];
  include_new_makers: boolean;
  include_price_drops: boolean;
  include_trending: boolean;
  include_followed_shops: boolean;
  include_recommendations: boolean;
  last_sent: string | null;
  created_at: string;
  updated_at: string;
}

// Map database row to UI preferences format
const mapDbToPreferences = (row: EmailDigestDbRow | null): EmailDigestPreference[] => {
  if (!row) {
    // Return default preferences when no row exists
    return [
      { digest_type: 'shop_follows', frequency: 'weekly', last_sent_at: null, is_active: true },
      { digest_type: 'collections', frequency: 'weekly', last_sent_at: null, is_active: true },
      { digest_type: 'weekly_digest', frequency: 'weekly', last_sent_at: null, is_active: true },
      { digest_type: 'monthly_summary', frequency: 'monthly', last_sent_at: null, is_active: true },
    ];
  }

  return [
    {
      digest_type: 'shop_follows',
      frequency: row.frequency,
      last_sent_at: row.last_sent,
      is_active: row.include_followed_shops && row.frequency !== 'never',
    },
    {
      digest_type: 'collections',
      frequency: row.frequency,
      last_sent_at: row.last_sent,
      is_active: row.include_new_makers && row.frequency !== 'never',
    },
    {
      digest_type: 'weekly_digest',
      frequency: row.frequency,
      last_sent_at: row.last_sent,
      is_active: row.include_trending && row.frequency !== 'never',
    },
    {
      digest_type: 'monthly_summary',
      frequency: 'monthly',
      last_sent_at: row.last_sent,
      is_active: row.include_recommendations && row.frequency !== 'never',
    },
  ];
};

export const useEmailDigest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EmailDigestPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbRow, setDbRow] = useState<EmailDigestDbRow | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('email_digest_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        console.error('Error fetching email digest preferences:', error);
      }

      const row = data as EmailDigestDbRow | null;
      setDbRow(row);
      setPreferences(mapDbToPreferences(row));
    } catch (error) {
      console.error('Error fetching email digest preferences:', error);
      setPreferences(mapDbToPreferences(null));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (digestType: string, updates: Partial<EmailDigestPreference>) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to update your preferences.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Map digest type to database column
      const columnMapping: Record<string, string> = {
        shop_follows: 'include_followed_shops',
        collections: 'include_new_makers',
        weekly_digest: 'include_trending',
        monthly_summary: 'include_recommendations',
      };

      const column = columnMapping[digestType];
      if (!column) {
        console.error('Unknown digest type:', digestType);
        return;
      }

      // Build update object
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.is_active !== undefined) {
        updateData[column] = updates.is_active;
      }

      if (updates.frequency) {
        updateData.frequency = updates.frequency === 'never' ? 'never' : updates.frequency;
      }

      // Optimistically update UI
      setPreferences((prev) =>
        prev.map((p) =>
          p.digest_type === digestType ? { ...p, ...updates } : p
        )
      );

      // Check if row exists
      if (dbRow) {
        // Update existing row
        const { error } = await supabase
          .from('email_digest_preferences' as any)
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new row with defaults
        const { error } = await supabase
          .from('email_digest_preferences' as any)
          .insert({
            user_id: user.id,
            frequency: updates.frequency || 'weekly',
            [column]: updates.is_active ?? true,
          });

        if (error) throw error;

        // Refresh to get the new row
        await fetchPreferences();
      }

      toast({
        title: "Preferences updated",
        description: "Your email digest preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating email digest preference:', error);
      // Revert optimistic update
      await fetchPreferences();
      toast({
        title: "Error",
        description: "Failed to update preference. Please try again.",
        variant: "destructive",
      });
    }
  };

  const subscribeToDigest = async (digestType: string, frequency: string) => {
    await updatePreference(digestType, { frequency, is_active: true });
  };

  const unsubscribeFromDigest = async (digestType: string) => {
    await updatePreference(digestType, { frequency: 'never', is_active: false });
  };

  const unsubscribeFromAll = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('email_digest_preferences' as any)
        .upsert({
          user_id: user.id,
          frequency: 'never',
          include_new_makers: false,
          include_price_drops: false,
          include_trending: false,
          include_followed_shops: false,
          include_recommendations: false,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await fetchPreferences();

      toast({
        title: "Unsubscribed",
        description: "You have been unsubscribed from all email digests.",
      });
    } catch (error) {
      console.error('Error unsubscribing from all digests:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    subscribeToDigest,
    unsubscribeFromDigest,
    unsubscribeFromAll,
    refreshPreferences: fetchPreferences,
  };
};