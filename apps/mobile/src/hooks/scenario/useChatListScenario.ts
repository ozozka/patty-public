/** Scenario hook for chat list functionality. */
import type { Match } from '@patty/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useConversations } from 'src/hooks/api/useMessageApi';
import { useChatStore } from 'src/store/useChatStore';

export const useChatListScenario = () => {
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useConversations();
  const newMatchesIds = useChatStore((state) => state.newMatches);
  const initializeUnreadCounts = useChatStore(
    (state) => state.initializeUnreadCounts,
  );

  // Initialize unread counts from server when matches are loaded
  useEffect(() => {
    if (matches) {
      const counts: Record<string, number> = {};
      matches.forEach((match: Match) => {
        const count = Number(match.unread_count);
        if (count > 0) {
          counts[match.id] = count;
        }
      });
      initializeUnreadCounts(counts);
    }
  }, [matches, initializeUnreadCounts]);

  const { newMatches, conversations } = useMemo(() => {
    if (!matches) return { newMatches: [], conversations: [] };

    const newM = matches.filter(
      (m) => !m.last_message || newMatchesIds.includes(m.id),
    );
    const convs = matches.filter(
      (m) => m.last_message && !newMatchesIds.includes(m.id),
    );

    return { newMatches: newM, conversations: convs };
  }, [matches, newMatchesIds]);

  const refreshConversations = () => {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return {
    newMatches,
    conversations,
    isLoading,
    refreshConversations,
  };
};
