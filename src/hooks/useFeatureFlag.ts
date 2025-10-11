import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  isFeatureEnabled, 
  type FeatureFlagKey 
} from '@/utils/featureFlags';

/**
 * Hook to check if a feature flag is enabled for the current user
 * @param flagKey Feature flag key
 * @returns Object with isEnabled status and loading state
 */
export function useFeatureFlag(flagKey: FeatureFlagKey) {
  const [userId, setUserId] = useState<string | undefined>();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Get user roles
  const { data: rolesData } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data?.map(r => r.role) || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (rolesData) {
      setUserRoles(rolesData);
    }
  }, [rolesData]);

  const isEnabled = isFeatureEnabled(flagKey, userId, userRoles);

  return {
    isEnabled,
    isLoading: !userId && !rolesData,
    userId,
    userRoles,
  };
}

/**
 * Hook to get multiple feature flags at once
 * @param flagKeys Array of feature flag keys
 * @returns Object with feature flags as keys and enabled status as values
 */
export function useFeatureFlags(flagKeys: FeatureFlagKey[]) {
  const [userId, setUserId] = useState<string | undefined>();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data?.map(r => r.role) || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (rolesData) {
      setUserRoles(rolesData);
    }
  }, [rolesData]);

  const flags = flagKeys.reduce((acc, key) => {
    acc[key] = isFeatureEnabled(key, userId, userRoles);
    return acc;
  }, {} as Record<FeatureFlagKey, boolean>);

  return {
    flags,
    isLoading,
    userId,
    userRoles,
  };
}
