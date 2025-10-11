import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  isFeatureEnabled, 
  getABTestVariant,
  trackFeatureUsage,
  type FlagKey 
} from '@/utils/featureFlags';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';

interface UserContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

/**
 * Hook to check if a feature flag is enabled for the current user
 * Uses stable bucketing for A/B tests (persists across sessions)
 * 
 * @param flagKey Feature flag key
 * @returns Object with isEnabled status, loading state, and user context
 */
export function useFeatureFlag(flagKey: FlagKey) {
  const [userContext, setUserContext] = useState<UserContext>({});
  const { fingerprintId } = useDeviceFingerprint();

  // Get current user and session
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserContext({
          userId: session.user.id,
          userEmail: session.user.email,
        });
      }
    };
    getCurrentUser();
  }, []);

  // Get user roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', userContext.userId],
    queryFn: async () => {
      if (!userContext.userId) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userContext.userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return null;
      }
      
      // Return primary role (admin > moderator > user)
      const roles = data?.map(r => r.role) || [];
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('moderator')) return 'moderator';
      return 'user';
    },
    enabled: !!userContext.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine unique identifier (userId or fingerprintId)
  const identifier = userContext.userId || fingerprintId || 'anonymous';

  // Check if feature is enabled
  const isEnabled = useMemo(() => {
    const enabled = isFeatureEnabled(
      flagKey,
      identifier,
      rolesData || undefined,
      userContext.userEmail
    );

    // Track feature flag usage (optional analytics)
    if (typeof window !== 'undefined') {
      trackFeatureUsage(flagKey, enabled, identifier);
    }

    return enabled;
  }, [flagKey, identifier, rolesData, userContext.userEmail]);

  return {
    isEnabled,
    isLoading: rolesLoading && !!userContext.userId,
    userId: userContext.userId,
    userRole: rolesData || undefined,
    userEmail: userContext.userEmail,
    identifier,
  };
}

/**
 * Hook for A/B testing with sticky assignment
 * Ensures users consistently see the same variant across sessions
 * 
 * @param testKey Test identifier
 * @param percentage Percentage for variant A (default 50%)
 * @returns Object with variant ('A' | 'B') and context
 */
export function useABTest(testKey: string, percentage: number = 50) {
  const { fingerprintId } = useDeviceFingerprint();
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  const identifier = userId || fingerprintId || 'anonymous';

  const variant = useMemo(() => {
    return getABTestVariant(testKey, identifier, percentage);
  }, [testKey, identifier, percentage]);

  // Track A/B test assignment
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('ABTest', {
        props: {
          test: testKey,
          variant,
          userId: identifier,
        },
      });
    }
  }, [testKey, variant, identifier]);

  return {
    variant,
    isA: variant === 'A',
    isB: variant === 'B',
    identifier,
  };
}

/**
 * Hook to get multiple feature flags at once
 * Useful for checking multiple flags in one component
 * 
 * @param flagKeys Array of feature flag keys
 * @returns Object with flags and loading state
 */
export function useFeatureFlags(flagKeys: FlagKey[]) {
  const [userContext, setUserContext] = useState<UserContext>({});
  const { fingerprintId } = useDeviceFingerprint();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserContext({
          userId: session.user.id,
          userEmail: session.user.email,
        });
      }
    };
    getCurrentUser();
  }, []);

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['user-roles', userContext.userId],
    queryFn: async () => {
      if (!userContext.userId) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userContext.userId);
      
      if (error) return null;
      
      const roles = data?.map(r => r.role) || [];
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('moderator')) return 'moderator';
      return 'user';
    },
    enabled: !!userContext.userId,
    staleTime: 5 * 60 * 1000,
  });

  const identifier = userContext.userId || fingerprintId || 'anonymous';

  const flags = useMemo(() => {
    return flagKeys.reduce((acc, key) => {
      acc[key] = isFeatureEnabled(
        key,
        identifier,
        rolesData || undefined,
        userContext.userEmail
      );
      return acc;
    }, {} as Record<FlagKey, boolean>);
  }, [flagKeys, identifier, rolesData, userContext.userEmail]);

  return {
    flags,
    isLoading,
    identifier,
  };
}
