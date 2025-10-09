import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfilesService } from '@/services/ProfilesService';

export const PROFILES_QUERY_KEY = 'admin-profiles';

export const useProfilesQuery = () => {
  return useQuery({
    queryKey: [PROFILES_QUERY_KEY],
    queryFn: () => ProfilesService.getAllProfiles(),
    staleTime: 60000, // 1 минута
    gcTime: 600000, // 10 минут
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      profileId, 
      updates 
    }: { 
      profileId: string; 
      updates: any;
    }) => ProfilesService.updateProfile(profileId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILES_QUERY_KEY] });
    },
  });
};

export const useModerateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      profileId, 
      isApproved, 
      moderatorId, 
      notes 
    }: { 
      profileId: string; 
      isApproved: boolean; 
      moderatorId: string; 
      notes?: string;
    }) => ProfilesService.moderateProfile(profileId, isApproved, moderatorId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILES_QUERY_KEY] });
    },
  });
};

export const useEmailDomainStats = () => {
  return useQuery({
    queryKey: ['email-domain-stats'],
    queryFn: () => ProfilesService.getEmailDomainStats(),
    staleTime: 300000, // 5 минут
  });
};
