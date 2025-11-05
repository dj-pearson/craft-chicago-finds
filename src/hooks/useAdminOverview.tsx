import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminOverviewStats {
  totalCities: number;
  activeCities: number;
  totalUsers: number;
  activeSellers: number;
  pendingReviews: number;
  loading: boolean;
}

interface RecentActivity {
  description: string;
  timestamp: string;
}

export const useAdminOverview = () => {
  const [stats, setStats] = useState<AdminOverviewStats>({
    totalCities: 0,
    activeCities: 0,
    totalUsers: 0,
    activeSellers: 0,
    pendingReviews: 0,
    loading: true,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchOverviewStats();
    fetchRecentActivity();
  }, []);

  const fetchOverviewStats = async () => {
    try {
      // Fetch cities count
      const { count: citiesCount, error: citiesError } = await supabase
        .from('cities')
        .select('*', { count: 'exact', head: true });

      // Fetch active cities count
      const { count: activeCitiesCount } = await supabase
        .from('cities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch total users count from profiles
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active sellers count
      const { count: sellersCount, error: sellersError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller')
        .eq('is_active', true);

      // Fetch pending reviews (listings in pending status)
      const { count: pendingCount, error: pendingError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (citiesError) console.error('Error fetching cities:', citiesError);
      if (usersError) console.error('Error fetching users:', usersError);
      if (sellersError) console.error('Error fetching sellers:', sellersError);
      if (pendingError) console.error('Error fetching pending reviews:', pendingError);

      setStats({
        totalCities: citiesCount || 0,
        activeCities: activeCitiesCount || 0,
        totalUsers: usersCount || 0,
        activeSellers: sellersCount || 0,
        pendingReviews: pendingCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_audit_log')
        .select('action_type, entity_type, created_at, details')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent activity:', error);
        return;
      }

      const activities: RecentActivity[] = (data || []).map(log => {
        const entityType = log.entity_type.replace('_', ' ');
        const actionType = log.action_type.toLowerCase();
        return {
          description: `${entityType} ${actionType}`,
          timestamp: log.created_at,
        };
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  return {
    stats,
    recentActivity,
    refetch: () => {
      fetchOverviewStats();
      fetchRecentActivity();
    },
  };
};
