jest.mock('react-native-keyboard-controller', () => {
  const MockReact = require('react');
  const { View } = require('react-native');

  return {
    KeyboardProvider: ({ children }: { children: React.ReactNode }) =>
      MockReact.createElement(View, null, children),
    KeyboardAwareScrollView: ({ children, ...props }: any) => {
      return MockReact.createElement(View, props, children);
    },
    KeyboardStickyView: ({ children, ...props }: any) => {
      return MockReact.createElement(View, props, children);
    },
    KeyboardAvoidingView: ({ children, ...props }: any) => {
      return MockReact.createElement(View, props, children);
    },
    KeyboardController: {
      setInputMode: jest.fn(),
      setDefaultMode: jest.fn(),
    },
    useKeyboardHandler: jest.fn(),
    useKeyboardState: jest.fn(() => ({ height: 0, isVisible: false })),
    useReanimatedKeyboardAnimation: jest.fn(() => ({
      height: { value: 0 },
      progress: { value: 0 },
    })),
    KeyboardEvents: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});
