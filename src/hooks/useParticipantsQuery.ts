import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParticipantsService, ParticipantFilters } from '@/services/ParticipantsService';

export const PARTICIPANTS_QUERY_KEY = 'admin-participants';

export const useParticipantsQuery = (filters: ParticipantFilters = {}) => {
  return useQuery({
    queryKey: [PARTICIPANTS_QUERY_KEY, filters],
    queryFn: () => ParticipantsService.getParticipants(filters),
    staleTime: 30000, // 30 секунд
    gcTime: 300000, // 5 минут
  });
};

export const useUpdateParticipantStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      participantId, 
      newStatus, 
      userId 
    }: { 
      participantId: string; 
      newStatus: string; 
      userId: string;
    }) => ParticipantsService.updateStatus(participantId, newStatus, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_QUERY_KEY] });
    },
  });
};

export const useUpdateParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      participantId, 
      updates, 
      userId 
    }: { 
      participantId: string; 
      updates: any; 
      userId: string;
    }) => ParticipantsService.updateParticipant(participantId, updates, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_QUERY_KEY] });
    },
  });
};

export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (participantId: string) => ParticipantsService.deleteParticipant(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_QUERY_KEY] });
    },
  });
};

export const useRestoreParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (participantId: string) => ParticipantsService.restoreParticipant(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_QUERY_KEY] });
    },
  });
};
