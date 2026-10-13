/**
 * Store for managing chat state and messages.
 */
import type { Message } from '@patty/contracts';
import { create } from 'zustand';

export interface ChatState {
  messages: Record<string, Message[]>; // matchId -> Message[]
  onlineUsers: string[];
  typingUsers: Record<string, string[]>; // matchId -> userIds
  typingTimers: Record<string, NodeJS.Timeout>; // `${matchId}-${userId}` -> Timeout
  unreadCounts: Record<string, number>; // matchId -> count
  newMatches: string[]; // matchIds with no messages

  // Actions
  setMessages: (matchId: string, messages: Message[]) => void;
  appendMessage: (
    matchId: string,
    message: Message,
    isActive?: boolean,
  ) => void;
  updateReadStatus: (
    matchId: string,
    lastReadMessageId: string,
    isRead: boolean,
  ) => void;
  setOnlineStatus: (userId: string, online: boolean) => void;
  setTypingStatus: (matchId: string, userId: string, isTyping: boolean) => void;
  clearChat: (matchId: string) => void;
  clearUnreadCount: (matchId: string) => void;
  addMatch: (matchId: string) => void;
  setNewMatches: (matchIds: string[]) => void;
  reset: () => void;
  initializeUnreadCounts: (counts: Record<string, number>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  onlineUsers: [],
  typingUsers: {},
  typingTimers: {},
  unreadCounts: {},
  newMatches: [],

  reset: () =>
    set((state) => {
      // Clear all active timers
      Object.values(state.typingTimers).forEach(clearTimeout);
      return {
        messages: {},
        onlineUsers: [],
        typingUsers: {},
        typingTimers: {},
        unreadCounts: {},
        newMatches: [],
      };
    }),

  setMessages: (matchId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [matchId]: messages },
    })),

  appendMessage: (matchId, message, isActive) =>
    set((state) => {
      const currentMessages = state.messages[matchId] ?? [];
      // Avoid duplicates
      if (currentMessages.some((m) => m.id === message.id)) return state;

      const newUnreadCounts = { ...state.unreadCounts };
      if (!isActive && !message.is_read) {
        newUnreadCounts[matchId] = (newUnreadCounts[matchId] ?? 0) + 1;
      }

      // If a message is received, it's no longer a "new match" (in the no-messages sense)
      const newMatches = state.newMatches.filter((id) => id !== matchId);

      return {
        messages: {
          ...state.messages,
          [matchId]: [message, ...currentMessages], // Newest first
        },
        unreadCounts: newUnreadCounts,
        newMatches,
      };
    }),

  updateReadStatus: (matchId, lastReadMessageId, isRead) =>
    set((state) => {
      const currentMessages = state.messages[matchId] ?? [];
      const lastReadMessage = currentMessages.find(
        (m) => m.id === lastReadMessageId,
      );

      if (!lastReadMessage) return state;

      const updatedMessages = currentMessages.map((m) => {
        const isBeforeOrEqual =
          new Date(m.created_at) <= new Date(lastReadMessage.created_at);
        return isBeforeOrEqual ? { ...m, is_read: isRead } : m;
      });

      return {
        messages: { ...state.messages, [matchId]: updatedMessages },
      };
    }),

  setOnlineStatus: (userId, online) =>
    set((state) => {
      if (online) {
        if (state.onlineUsers.includes(userId)) return state;
        return { onlineUsers: [...state.onlineUsers, userId] };
      } else {
        return { onlineUsers: state.onlineUsers.filter((id) => id !== userId) };
      }
    }),

  setTypingStatus: (matchId, userId, isTyping) =>
    set((state) => {
      const timerKey = `${matchId}-${userId}`;
      const currentTimers = { ...state.typingTimers };

      // Clear existing timer if any
      if (currentTimers[timerKey]) {
        clearTimeout(currentTimers[timerKey]);
        delete currentTimers[timerKey];
      }

      const currentTyping = state.typingUsers[matchId] ?? [];
      const newTyping = currentTyping.filter((id) => id !== userId);

      if (isTyping) {
        newTyping.push(userId);
        // Set a 10s TTL to auto-clear typing status
        currentTimers[timerKey] = setTimeout(() => {
          useChatStore.getState().setTypingStatus(matchId, userId, false);
        }, 10000);
      }

      return {
        typingUsers: { ...state.typingUsers, [matchId]: newTyping },
        typingTimers: currentTimers,
      };
    }),

  clearChat: (matchId) =>
    set((state) => {
      const { [matchId]: _removedMessages, ...remainingMessages } =
        state.messages;
      const { [matchId]: _removedTyping, ...remainingTyping } =
        state.typingUsers;
      const { [matchId]: _removedUnread, ...remainingUnread } =
        state.unreadCounts;

      // Clear any timers associated with this match
      const remainingTimers = { ...state.typingTimers };
      Object.keys(remainingTimers).forEach((key) => {
        if (key.startsWith(`${matchId}-`)) {
          clearTimeout(remainingTimers[key]);
          delete remainingTimers[key];
        }
      });

      const newMatches = state.newMatches.filter((id) => id !== matchId);
      return {
        messages: remainingMessages,
        typingUsers: remainingTyping,
        typingTimers: remainingTimers,
        unreadCounts: remainingUnread,
        newMatches,
      };
    }),

  clearUnreadCount: (matchId) =>
    set((state) => {
      const newUnreadCounts = { ...state.unreadCounts };
      delete newUnreadCounts[matchId];
      return { unreadCounts: newUnreadCounts };
    }),

  addMatch: (matchId) =>
    set((state) => {
      if (state.newMatches.includes(matchId)) return state;
      return { newMatches: [...state.newMatches, matchId] };
    }),

  setNewMatches: (matchIds) => set(() => ({ newMatches: matchIds })),

  initializeUnreadCounts: (counts) =>
    set(() => ({
      unreadCounts: counts,
    })),
}));
