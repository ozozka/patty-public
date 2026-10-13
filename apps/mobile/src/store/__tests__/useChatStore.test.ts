import type { Message } from '@patty/contracts';

import { useChatStore } from '../useChatStore';

const mockMessage: Message = {
  id: 'msg-1',
  match_id: 'match-1',
  sender_id: 'user-1',
  content: 'hello',
  message_type: 'text',
  is_read: false,
  metadata: {},
  created_at: new Date().toISOString(),
};

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().clearChat('match-1');
  });

  it('should set and append messages', () => {
    const { setMessages, appendMessage } = useChatStore.getState();

    setMessages('match-1', [mockMessage]);
    expect(useChatStore.getState().messages['match-1']).toEqual([mockMessage]);

    const newMessage = { ...mockMessage, id: 'msg-2', content: 'new' };
    appendMessage('match-1', newMessage);
    expect(useChatStore.getState().messages['match-1']).toEqual([
      newMessage,
      mockMessage,
    ]);
  });

  it('should update message status', () => {
    const { setMessages, updateReadStatus } = useChatStore.getState();
    setMessages('match-1', [mockMessage]);

    updateReadStatus('match-1', 'msg-1', true);
    expect(useChatStore.getState().messages['match-1']?.[0]?.is_read).toBe(
      true,
    );
  });

  it('should clear typing status automatically after TTL', () => {
    jest.useFakeTimers();
    const { setTypingStatus } = useChatStore.getState();

    setTypingStatus('match-1', 'user-1', true);
    expect(
      useChatStore.getState().typingUsers['match-1']?.includes('user-1'),
    ).toBe(true);

    // Fast-forward past the 10 second TTL
    jest.advanceTimersByTime(11000);

    expect(
      useChatStore.getState().typingUsers['match-1']?.includes('user-1'),
    ).toBe(false);

    jest.useRealTimers();
  });
});
