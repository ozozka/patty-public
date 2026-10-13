import { jest } from '@jest/globals';

// Mock Config — override only the TIMEOUT so tests run without network delays.
jest.mock('src/Config', () => {
  const actual = jest.requireActual('src/Config') as {
    Config: { api: { TIMEOUT: number } };
  };
  return {
    __esModule: true,
    Config: {
      ...actual.Config,
      api: {
        ...actual.Config.api,
        TIMEOUT: 100,
      },
    },
  };
});

// Mock Api Client
jest.mock('src/api/client', () => ({
  __esModule: true,
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
    PUT: jest.fn(),
    PATCH: jest.fn(),
    DELETE: jest.fn(),
    use: jest.fn(),
  },
}));

// Mock Token Management
jest.mock('src/api/token', () => ({
  __esModule: true,
  setClientTokenGetter: jest.fn(),
  getClientToken: jest.fn(() => null),
}));

// Mock queryClient globally with test-safe defaults
jest.mock('src/lib/queryClient', () => {
  const { QueryClient } = require('@tanstack/react-query');
  return {
    shouldRetry: (failureCount: number, error: unknown): boolean => {
      if (!(error && typeof error === 'object' && 'error' in error)) {
        return failureCount < 2;
      }
      // TypeScript narrows `error` to `object & { error: unknown }` here
      const errorCode = error.error;
      if (
        errorCode === 'UNAUTHORIZED' ||
        errorCode === 'FORBIDDEN' ||
        errorCode === 'NOT_FOUND'
      ) {
        return false;
      }
      return failureCount < 2;
    },
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
          networkMode: 'always',
        },
        mutations: {
          retry: false,
          networkMode: 'always',
        },
      },
    }),
  };
});

// Mock ChatService
jest.mock('src/service/ChatService', () => {
  const mockInstance = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(() => () => {}),
    sendEvent: jest.fn(),
    getConversations: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    destroy: jest.fn(),
  };

  const MockChatService = Object.assign(
    jest.fn().mockImplementation(() => mockInstance),
    {
      getConversations: mockInstance.getConversations,
      getMessages: mockInstance.getMessages,
      sendMessage: mockInstance.sendMessage,
    },
  );

  return {
    ChatService: MockChatService,
    chatService: mockInstance,
    getChatService: jest.fn(() => mockInstance),
  };
});

// Mock Cloudinary
jest.mock('src/hooks/feature/useCloudinaryUpload', () => ({
  useCloudinaryUpload: jest.fn(() => ({
    uploadImage: jest.fn(() =>
      Promise.resolve('https://mock-image.com/res.jpg'),
    ),
    isUploading: false,
  })),
}));
