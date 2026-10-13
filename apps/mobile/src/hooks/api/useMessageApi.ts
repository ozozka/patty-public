/** Source file for useMessageApi. */
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from 'src/lib/queryKeys';
import { ChatService } from 'src/service/ChatService';

import { useApiMutation } from './useApiMutation';

const ONE_MINUTE = 1000 * 60;
const THIRTY_MINUTES = ONE_MINUTE * 30;

export const useConversations = () => {
  return useQuery({
    queryKey: QueryKeys.conversations(),
    queryFn: () => ChatService.getConversations(),
    staleTime: ONE_MINUTE,
    refetchOnMount: false,
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: QueryKeys.messages(conversationId),
    queryFn: () => ChatService.getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 0,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: false,
  });
};

/**
 * Hook to send a message.
 */
export const useSendMessage = (conversationId: string) => {
  return useApiMutation({
    mutationFn: (content: string) =>
      ChatService.sendMessage(conversationId, content),
    invalidateQueries: [
      QueryKeys.messages(conversationId),
      QueryKeys.conversations(),
    ],
  });
};
