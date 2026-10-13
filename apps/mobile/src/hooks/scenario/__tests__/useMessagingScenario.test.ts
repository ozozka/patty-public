import { useMessages } from 'src/hooks/api/useMessageApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import { MediaService } from 'src/service/MediaService';
import type { ChatState } from 'src/store/useChatStore';
import { useChatStore } from 'src/store/useChatStore';

import { renderHookWithProviders } from '../../../__tests__/utils/test-utils';
import * as ChatServiceModule from '../../../service/ChatService';
import { useMessagingScenario } from '../useMessagingScenario';

// Mocks
jest.mock('../../../service/ChatService');
jest.mock('src/store/useChatStore');
jest.mock('src/hooks/api/useMessageApi');
jest.mock('src/hooks/api/useUserApi');
jest.mock('src/service/MediaService');
jest.mock('src/store/useAuthStore');

describe('useMessagingScenario', () => {
  const mockMatchId = 'match-1';
  const mockSetMessages = jest.fn();
  const mockAppendMessage = jest.fn();
  const mockSetTypingStatus = jest.fn();
  const mockUpdateReadStatus = jest.fn();
  const mockClearUnreadCount = jest.fn();

  const mockChatService = {
    subscribe: jest.fn(() => () => {}),
    sendEvent: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockStore = {
    messages: { [mockMatchId]: [] },
    setMessages: mockSetMessages,
    appendMessage: mockAppendMessage,
    setTypingStatus: mockSetTypingStatus,
    typingUsers: { [mockMatchId]: new Set() },
    updateReadStatus: mockUpdateReadStatus,
    clearUnreadCount: mockClearUnreadCount,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useProfile).mockReturnValue({
      data: { id: 'me' },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfile>);
    jest
      .mocked(ChatServiceModule.getChatService)
      .mockReturnValue(
        mockChatService as unknown as ReturnType<
          typeof ChatServiceModule.getChatService
        >,
      );
    jest
      .mocked(useChatStore)
      .mockImplementation((selector) =>
        selector
          ? selector(mockStore as unknown as ChatState)
          : (mockStore as unknown as ChatState),
      );
    jest.mocked(useMessages).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
  });

  it('loads initial messages into store', () => {
    const mockMsgs = [{ id: '1', is_read: true }];
    jest.mocked(useMessages).mockReturnValue({
      data: mockMsgs,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);

    renderHookWithProviders(() => useMessagingScenario(mockMatchId));

    expect(mockSetMessages).toHaveBeenCalledWith(mockMatchId, mockMsgs);
  });

  it('handles incoming message', async () => {
    let subscriber: (event: unknown) => void = () => {};
    (mockChatService.subscribe as jest.Mock).mockImplementation(
      (cb: (event: unknown) => void) => {
        subscriber = cb;
        return () => {};
      },
    );

    renderHookWithProviders(() => useMessagingScenario(mockMatchId));

    const msg = {
      type: 'MessageReceive',
      payload: {
        match_id: mockMatchId,
        id: '2',
        sender_id: 'other',
        content: 'hello',
        created_at: new Date().toISOString(),
        message_type: 'text',
        is_read: false,
      },
    };

    subscriber({ type: 'EVENT', event: msg });

    expect(mockAppendMessage).toHaveBeenCalledWith(
      mockMatchId,
      msg.payload,
      true,
    );

    // Should send read receipt for incoming message
    expect(mockChatService.sendEvent).toHaveBeenCalledWith({
      type: 'ReadReceipt',
      payload: {
        match_id: mockMatchId,
        last_read_message_id: '2',
      },
    });
  });

  it('refetches messages on RECONNECTED event', async () => {
    let subscriber: (event: unknown) => void = () => {};
    (mockChatService.subscribe as jest.Mock).mockImplementation(
      (cb: (event: unknown) => void) => {
        subscriber = cb;
        return () => {};
      },
    );

    const mockRefetch = jest.fn();
    jest.mocked(useMessages).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useMessages>);

    renderHookWithProviders(() => useMessagingScenario(mockMatchId));

    subscriber({ type: 'RECONNECTED' });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('sends text message', async () => {
    const { result } = renderHookWithProviders(() =>
      useMessagingScenario(mockMatchId),
    );

    await result.current.sendMessage('hello', 'text');

    expect(mockChatService.sendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MessageSend',
        payload: {
          match_id: mockMatchId,
          content: 'hello',
          message_type: 'text',
          reply_to_id: null,
        },
      }),
    );
  });

  it('sends image message', async () => {
    jest
      .mocked(MediaService.getSignature)
      .mockResolvedValue(
        'sig' as unknown as Awaited<
          ReturnType<typeof MediaService.getSignature>
        >,
      );
    jest
      .mocked(MediaService.uploadToCloudinary)
      .mockResolvedValue('http://img.com');

    const { result } = renderHookWithProviders(() =>
      useMessagingScenario(mockMatchId),
    );

    await result.current.sendMessage('file://img.jpg', 'image');

    expect(MediaService.uploadToCloudinary).toHaveBeenCalled();
    expect(mockChatService.sendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MessageSend',
        payload: {
          match_id: mockMatchId,
          content: 'http://img.com',
          message_type: 'image',
          reply_to_id: null,
        },
      }),
    );
  });
});
