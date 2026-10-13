import type { BlockUserRequest } from '@patty/contracts';
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from 'src/hooks/api/useApiMutation';
import { QueryKeys } from 'src/lib/queryKeys';
import { ModerationService } from 'src/service/ModerationService';

export function useBlockUser() {
  return useApiMutation({
    mutationFn: (req: BlockUserRequest) => ModerationService.blockUser(req),
    invalidateQueries: [
      ['candidates'] as const,
      QueryKeys.matches(),
      QueryKeys.blockedUsers(),
    ],
  });
}

export function useUnblockUser() {
  return useApiMutation({
    mutationFn: (blockedId: string) => ModerationService.unblockUser(blockedId),
    invalidateQueries: [QueryKeys.blockedUsers()],
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: QueryKeys.blockedUsers(),
    queryFn: () => ModerationService.getBlockedUsers(),
  });
}
