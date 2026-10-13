import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  RenderHookOptions,
  RenderOptions,
} from '@testing-library/react-native';
import {
  render,
  renderHook as renderHookBase,
} from '@testing-library/react-native';
import React from 'react';
export { resetAllStores } from './resetStores';

let sharedQueryClient: QueryClient | null = null;

export function getSharedQueryClient(): QueryClient {
  sharedQueryClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return sharedQueryClient;
}

export function clearSharedQueryClient() {
  if (sharedQueryClient) {
    void sharedQueryClient.cancelQueries();
    sharedQueryClient.clear();
  }
}

export function createTestQueryClient() {
  return getSharedQueryClient();
}

export function cleanupAllQueryClients() {
  clearSharedQueryClient();
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * A wrapper component that provides necessary context for testing.
 */
export const AllTheProviders = ({
  children,
  queryClient: customQueryClient,
}: AllTheProvidersProps) => {
  const client = customQueryClient ?? createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

/**
 * A custom render function that includes necessary providers.
 */
function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient },
) {
  const { queryClient: customClient, ...renderOptions } = options ?? {};
  const client = customClient ?? createTestQueryClient();

  return {
    ...render(ui, {
      wrapper: (props) => <AllTheProviders {...props} queryClient={client} />,
      ...renderOptions,
    }),
    queryClient: client,
  };
}

/**
 * Helper to render a screen with standard navigation/route props.
 */
function renderScreen<T extends React.ComponentType<any>>(
  ScreenComponent: T,
  props: Partial<React.ComponentProps<T>> = {},
  options?: Parameters<typeof renderWithProviders>[1],
) {
  const defaultProps = {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
      setParams: jest.fn(),
      dispatch: jest.fn(),
    },
    route: {
      params: {},
    },
  };

  // React.createElement infers props as `any` for ComponentType<any>, so the spread
  // is accepted without a cast.
  return renderWithProviders(
    React.createElement(ScreenComponent, { ...defaultProps, ...props }),
    options,
  );
}

/**
 * A custom renderHook that wraps with QueryClientProvider.
 */
function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'> & {
    queryClient?: QueryClient;
  },
) {
  const { queryClient: customClient, ...hookOptions } = options ?? {};
  const client = customClient ?? createTestQueryClient();
  return {
    ...renderHookBase(hook, {
      wrapper: (props: { children: React.ReactNode }) => (
        <AllTheProviders {...props} queryClient={client} />
      ),
      ...hookOptions,
    }),
    queryClient: client,
  };
}

export * from '@testing-library/react-native';
export { renderHookWithProviders, renderScreen, renderWithProviders };
export { factories } from './factories';

export const createMockMutation = (mockFn = jest.fn()) => ({
  mutate: mockFn,
  mutateAsync: mockFn,
  isPending: false,
  isSuccess: false,
  isError: false,
});

export const createMockQuery = function <T>(data: T, isLoading = false) {
  return {
    data,
    isLoading,
    isSuccess: !isLoading && !!data,
    refetch: jest.fn(),
  };
};

export const mockAuthStoreState = (overrides = {}) => ({
  authToken: 'mock-token',
  accountId: 'test-user',
  theme: 'system',
  ...overrides,
});

export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();
export const createMockNavigation = (overrides = {}) => ({
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
  ...overrides,
});

export const createMockMessagingScenario = (overrides = {}) => ({
  messages: [],
  isLoading: false,
  sendMessage: jest.fn(),
  isSending: false,
  sendTyping: jest.fn(),
  typingUser: null,
  replyingTo: null,
  setReplyingTo: jest.fn(),
  clearReply: jest.fn(),
  ...overrides,
});
