/** Scenario hook for messaging and real-time updates. */
import type { Message, MessageType } from '@patty/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useMessages } from 'src/hooks/api/useMessageApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import { QueryKeys } from 'src/lib/queryKeys';
import { getChatService } from 'src/service/ChatService';
import { MediaService } from 'src/service/MediaService';
import { useChatStore } from 'src/store/useChatStore';
import { logger } from 'src/utils/logger';

export const useMessagingScenario = (
  matchId: string,
  otherUserName?: string,
) => {
  const queryClient = useQueryClient();
  const { data: user } = useProfile();
  const userId = user?.id;
  const {
    messages: storeMessages,
    setMessages,
    appendMessage,
    setTypingStatus,
    typingUsers,
    updateReadStatus,
    clearUnreadCount,
  } = useChatStore();

  // Fetch initial messages via React Query hook
  const { data: initialMessages, isLoading, refetch } = useMessages(matchId);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const matchMessages = storeMessages[matchId] ?? [];
  const matchTyping = typingUsers[matchId] ?? [];
  const typingUser =
    matchTyping.length > 0 ? (otherUserName ?? 'Someone') : null;

  const handleReadReceipt = useCallback(
    (messageId: string) => {
      getChatService().sendEvent({
        type: 'ReadReceipt',
        payload: {
          match_id: matchId,
          last_read_message_id: messageId,
        },
      });
      clearUnreadCount(matchId);
    },
    [matchId, clearUnreadCount],
  );

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(matchId, initialMessages);

      // Mark unread messages as read when opening (watermark is the newest unread message)
      const unreadMessages = initialMessages.filter(
        (m) => !m.is_read && m.sender_id !== userId,
      );

      if (unreadMessages.length > 0) {
        // Since initialMessages is sorted newest first, the first one is the watermark
        const watermarkId = unreadMessages[0]?.id;
        if (watermarkId) {
          handleReadReceipt(watermarkId);
        }
      }
    }
  }, [initialMessages, matchId, setMessages, userId, handleReadReceipt]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      getChatService().sendEvent({
        type: isTyping ? 'TypingStart' : 'TypingStop',
        payload: {
          match_id: matchId,
        },
      });
    },
    [matchId],
  );

  // Ensure typing stop is sent on unmount
  useEffect(() => {
    return () => {
      sendTyping(false);
    };
  }, [sendTyping]);

  useEffect(() => {
    const unsubscribe = getChatService().subscribe((chatEvent) => {
      if (chatEvent.type === 'RECONNECTED') {
        logger.info('Chat reconnected, refetching messages for sync...');
        void refetch();
        void queryClient.invalidateQueries({ queryKey: QueryKeys.matches() });
        return;
      }

      const event = chatEvent.event;
      switch (event.type) {
        case 'MessageReceive':
          if (event.payload.match_id === matchId) {
            appendMessage(
              matchId,
              {
                ...event.payload,
                latitude: event.payload.latitude?.toString(),
                longitude: event.payload.longitude?.toString(),
              },
              true,
            );
            // Auto-mark as read if we are in the chat
            if (event.payload.sender_id !== userId) {
              handleReadReceipt(event.payload.id);
            }
          }
          break;
        case 'TypingStartRelay':
          if (
            event.payload.match_id === matchId &&
            event.payload.user_id !== userId
          ) {
            setTypingStatus(matchId, event.payload.user_id, true);
          }
          break;
        case 'TypingStopRelay':
          if (
            event.payload.match_id === matchId &&
            event.payload.user_id !== userId
          ) {
            setTypingStatus(matchId, event.payload.user_id, false);
          }
          break;
        case 'ReadReceiptRelay':
          if (event.payload.match_id === matchId) {
            updateReadStatus(matchId, event.payload.last_read_message_id, true);
          }
          break;
        case 'PresenceUpdate':
        case 'MatchCreated':
        case 'MatchDeleted':
        case 'TypingStart':
        case 'TypingStop':
        case 'ReadReceipt':
        case 'MessageSend':
        case 'Error':
          // Handled globally or not applicable to this scenario
          break;
      }
    });

    return () => unsubscribe();
  }, [
    matchId,
    userId,
    appendMessage,
    handleReadReceipt,
    setTypingStatus,
    updateReadStatus,
    refetch,
    queryClient,
  ]);

  const sendMessage = async (
    content: string,
    type: MessageType,
    latitude?: number,
    longitude?: number,
  ) => {
    setIsSending(true);
    try {
      let finalContent = content;
      if (type === 'image') {
        const signature = await MediaService.getSignature({
          image_type: 'chat',
          entity_id: matchId,
        });
        finalContent = await MediaService.uploadToCloudinary(
          content,
          signature,
        );
      }

      getChatService().sendEvent({
        type: 'MessageSend',
        payload: {
          match_id: matchId,
          content: finalContent,
          message_type: type,
          reply_to_id: replyingTo?.id ?? null,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        },
      });
      setReplyingTo(null);
    } catch (e) {
      logger.error('Failed to send message', { error: e });
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages: matchMessages,
    isLoading,
    sendMessage,
    isSending,
    sendTyping,
    typingUser,
    replyingTo,
    setReplyingTo,
    clearReply: () => setReplyingTo(null),
  };
};
