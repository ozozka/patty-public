import './src/__tests__/mocks/flash-list.mock';
import './src/__tests__/mocks/i18n.mock';
import './src/__tests__/mocks/keyboard-controller.mock';
import './src/__tests__/mocks/services.mock';
import './src/__tests__/mocks/ui.mock';

import { jest } from '@jest/globals';
import { cleanup } from '@testing-library/react-native';

import { server } from './src/__tests__/mocks/server';
import { resetFactories } from './src/__tests__/utils/factories';
import { resetAllStores } from './src/__tests__/utils/resetStores';
import { cleanupAllQueryClients } from './src/__tests__/utils/test-utils';
import { queryClient } from './src/lib/queryClient';

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement(View, { testID: props.testID }, props.children),
    BottomSheet: (props: any) =>
      React.createElement(View, { testID: props.testID }, props.children),
    BottomSheetModal: (props: any) =>
      React.createElement(View, { testID: props.testID }, props.children),
    BottomSheetModalProvider: (props: any) =>
      React.createElement(View, props, props.children),
    BottomSheetView: (props: any) =>
      React.createElement(View, props, props.children),
    BottomSheetBackdrop: () => null,
    BottomSheetScrollView: (props: any) =>
      React.createElement(View, props, props.children),
    BottomSheetFlatList: (props: any) => {
      return React.createElement(
        View,
        props,
        props.data?.map((item: any, index: number) =>
          props.renderItem({ item, index }),
        ),
      );
    },
    BottomSheetSectionList: (props: any) =>
      React.createElement(View, props, props.children),
    BottomSheetTextInput: (props: any) => React.createElement(View, props),
    BottomSheetHandle: () => null,
  };
});

jest.mock('src/utils/storage', () => {
  const rawActual: unknown = jest.requireActual('src/utils/storage');
  const actual =
    typeof rawActual === 'object' && rawActual !== null ? rawActual : {};
  const storage =
    'Storage' in actual &&
    typeof actual.Storage === 'object' &&
    actual.Storage !== null
      ? actual.Storage
      : {};
  return {
    Storage: {
      ...storage,
      getItem: jest.fn(() => Promise.resolve(null)),
      setItem: jest.fn(() => Promise.resolve()),
      removeItem: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
  };
});

jest.mock('src/utils/encoding', () => {
  const rawActual: unknown = jest.requireActual('src/utils/encoding');
  const actual =
    typeof rawActual === 'object' && rawActual !== null ? rawActual : {};
  const encoding =
    'Encoding' in actual &&
    typeof actual.Encoding === 'object' &&
    actual.Encoding !== null
      ? actual.Encoding
      : {};
  return {
    Encoding: {
      ...encoding,
    },
  };
});

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() =>
    Promise.resolve({
      uri: 'file://cropped.jpg',
      width: 800,
      height: 1066,
    }),
  ),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
});

jest.setTimeout(30000);

Object.defineProperty(global, 'dispatchEvent', {
  value: jest.fn(),
  writable: true,
});

if (typeof window !== 'undefined' && !window.dispatchEvent) {
  Object.defineProperty(window, 'dispatchEvent', {
    value: jest.fn(),
    writable: true,
  });
} else if (typeof global !== 'undefined' && !('dispatchEvent' in global)) {
  Object.defineProperty(global, 'dispatchEvent', {
    value: jest.fn(),
    writable: true,
  });
}

let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

beforeEach(() => {
  resetFactories();
  if (!consoleLogSpy) {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  cleanupAllQueryClients();
  if (queryClient) {
    void queryClient.cancelQueries();
    queryClient.clear();
  }
  resetAllStores();
});
