import 'react-native-gesture-handler/jestSetup';
// Modular Mocks (Static)
import './src/__tests__/mocks/expo.mock';
import './src/__tests__/mocks/i18n.mock';
import './src/__tests__/mocks/navigation.mock';

import { jest } from '@jest/globals';

// Mock AppState to avoid leaks from listeners
const mockAppState = {
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  currentState: 'active',
};
jest.mock('react-native/Libraries/AppState/AppState', () => mockAppState);

// Mock WebSocket globally — Object.defineProperty accepts any value, bypassing the strict type.
Object.defineProperty(global, 'WebSocket', {
  value: jest.fn().mockImplementation((url, protocols) => ({
    url,
    protocols,
    readyState: 0,
    send: jest.fn(),
    close: jest.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true,
});
