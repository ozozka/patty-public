import type { SwipeAction } from '@patty/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from 'src/hooks/api/useApiMutation';
import { QueryKeys } from 'src/lib/queryKeys';
import { MatchingService } from 'src/service/MatchingService';

export function useCandidates(
  activePetId: string | null,
  limit = 20,
  radiusKm = 50,
) {
  return useQuery({
    queryKey: QueryKeys.candidates(activePetId, radiusKm, limit),
    queryFn: () => {
      if (!activePetId) throw new Error('activePetId is required');
      return MatchingService.getCandidates({
        active_pet_id: activePetId,
        limit,
        radius_km: radiusKm,
      });
    },
    enabled: !!activePetId,
  });
}

export function useSwipe() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: ({
      activePetId,
      targetPetId,
      action,
    }: {
      activePetId: string;
      targetPetId: string;
      action: SwipeAction;
    }) =>
      MatchingService.swipe({
        active_pet_id: activePetId,
        target_pet_id: targetPetId,
        action,
      }),
    onSuccess: (data, variables) => {
      // Invalidate candidates to remove the swiped pet
      void queryClient.invalidateQueries({
        queryKey: QueryKeys.candidates(variables.activePetId),
      });

      // If it's a match, invalidate matches list
      if (data.is_match) {
        void queryClient.invalidateQueries({ queryKey: QueryKeys.matches() });
      }
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: QueryKeys.matches(),
    queryFn: () => MatchingService.getMatches(),
  });
}

export function useUnmatch() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (matchId: string) => MatchingService.unmatch(matchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.matches() });
    },
  });
}
