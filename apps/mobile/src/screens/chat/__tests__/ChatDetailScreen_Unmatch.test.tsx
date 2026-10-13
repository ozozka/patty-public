import { useNavigation, useRoute } from '@react-navigation/native';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { Config } from 'src/Config';
import { useMessagingScenario } from 'src/hooks/scenario/useMessagingScenario';
import { useToast } from 'src/hooks/ui/useToast';
import { getChatService } from 'src/service/ChatService';

import { server } from '../../../__tests__/mocks/server';
import {
  createMockNavigation,
  mockGoBack,
  mockNavigate,
  renderWithProviders,
} from '../../../__tests__/utils/test-utils';
import { ChatDetailScreen } from '../ChatDetailScreen';

jest.mock('src/hooks/scenario/useMessagingScenario');
jest.mock('src/hooks/ui/useToast');
jest.mock('src/service/ChatService');

const mockShowToast = jest.fn();
const mockSubscribe = jest.fn();

describe('ChatDetailScreen Unmatch', () => {
  const mockMatchId = 'conv-123';

  beforeEach(() => {
    jest.clearAllMocks();

    server.use(
      http.delete(`${Config.api.BASE_URL}matching/${mockMatchId}`, () =>
        HttpResponse.json({ success: true }),
      ),
    );

    jest.mocked(useRoute).mockReturnValue({
      params: {
        conversationId: mockMatchId,
      },
    } as unknown as ReturnType<typeof useRoute>);

    jest.mocked(useNavigation).mockReturnValue(
      createMockNavigation({
        canGoBack: jest.fn().mockReturnValue(true),
      }),
    );

    jest.mocked(useMessagingScenario).mockReturnValue({
      messages: [],
      isLoading: false,
      sendMessage: jest.fn(),
      isSending: false,
      sendTyping: jest.fn(),
      typingUser: null,
      replyingTo: null,
      setReplyingTo: jest.fn(),
      clearReply: jest.fn(),
    } as unknown as ReturnType<typeof useMessagingScenario>);

    jest.mocked(useToast).mockReturnValue({
      info: mockShowToast,
      success: jest.fn(),
      error: jest.fn(),
      show: jest.fn(),
    } as unknown as ReturnType<typeof useToast>);

    jest.mocked(getChatService().subscribe).mockImplementation((handler) => {
      mockSubscribe(handler);
      return jest.fn();
    });
  });

  it('redirects to chat list on MatchDeleted event for current conversation', () => {
    renderWithProviders(
      <ScreenContainer>
        <ChatDetailScreen />
      </ScreenContainer>,
    );

    expect(mockSubscribe).toHaveBeenCalled();
    const handler = mockSubscribe.mock.calls[0][0];

    handler({
      type: 'EVENT',
      event: {
        type: 'MatchDeleted',
        payload: { match_id: 'conv-123' },
      },
    });

    expect(mockShowToast).toHaveBeenCalledWith('matching.unmatch_success');
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('does NOT redirect on MatchDeleted for different conversationId', () => {
    renderWithProviders(
      <ScreenContainer>
        <ChatDetailScreen />
      </ScreenContainer>,
    );

    expect(mockSubscribe).toHaveBeenCalled();
    const handler = mockSubscribe.mock.calls[0][0];

    handler({
      type: 'EVENT',
      event: {
        type: 'MatchDeleted',
        payload: { match_id: 'other-conv' },
      },
    });

    expect(mockShowToast).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
