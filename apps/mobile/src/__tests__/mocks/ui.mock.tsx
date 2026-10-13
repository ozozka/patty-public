import { jest } from '@jest/globals';
import type React from 'react';

// Mock Unistyles — provides theme tokens to StyleSheet.create and useUnistyles
jest.mock('react-native-unistyles', () => {
  const { lightColors } = require('src/theme/light');
  const mockTokens = require('src/theme/tokens');
  const { StyleSheet: MockRNStyleSheet } = require('react-native');

  const mockTheme = {
    colors: lightColors,
    spacing: mockTokens.spacing,
    typography: mockTokens.typography,
    borderRadius: mockTokens.borderRadius,
    borderWidth: mockTokens.borderWidth,
    sizes: mockTokens.sizes,
    heights: mockTokens.heights,
    widths: mockTokens.widths,
    zIndex: mockTokens.zIndex,
    getShadow: mockTokens.getShadow,
  };

  return {
    StyleSheet: {
      create: (input: unknown) => {
        if (typeof input === 'function') {
          return MockRNStyleSheet.create(input(mockTheme));
        }
        return MockRNStyleSheet.create(input);
      },
      absoluteFill: MockRNStyleSheet.absoluteFill,
      absoluteFillObject: MockRNStyleSheet.absoluteFillObject,
      hairlineWidth: MockRNStyleSheet.hairlineWidth,
      configure: jest.fn(),
    },
    useUnistyles: jest.fn(() => ({ theme: mockTheme, rt: {} })),
    UnistylesRuntime: {
      setTheme: jest.fn(),
      themeName: 'light',
      colorScheme: 'light',
      hasAdaptiveThemes: false,
      setAdaptiveThemes: jest.fn(),
      updateTheme: jest.fn(),
      getTheme: jest.fn(() => mockTheme),
      setRootViewBackgroundColor: jest.fn(),
    },
  };
});

// Mock Lucide Icons — Proxy-based so any icon name works automatically.
// Adding a new icon to the app never requires updating this mock.
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) =>
      React.createElement(View, { ...props, testID: name });
    MockIcon.displayName = name;
    return MockIcon;
  };

  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        return createMockIcon(prop);
      },
    },
  );
});

// Mock Theme
jest.mock('src/hooks/ui/useTheme', () => {
  const actual = jest.requireActual('src/theme/light');
  const lightColors =
    actual !== null &&
    typeof actual === 'object' &&
    'lightColors' in actual &&
    typeof actual.lightColors === 'object'
      ? actual.lightColors
      : {};
  return {
    useTheme: jest.fn(() => ({
      theme: 'light',
      activeScheme: 'light',
      colors: {
        ...lightColors,
      },
      setTheme: jest.fn(),
      syncTheme: jest.fn(),
      getShadow: jest.fn(() => ({})),
    })),
  };
});

// Mock Safe Area
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({
      children,
    }: {
      children: (m: unknown) => React.ReactNode;
    }) => children(initialMetrics),
    SafeAreaContext: React.createContext(initialMetrics),
    SafeAreaInsetsContext: React.createContext(initialMetrics.insets),
    SafeAreaFrameContext: React.createContext(initialMetrics.frame),
    useSafeAreaInsets: () => initialMetrics.insets,
    useSafeAreaFrame: () => initialMetrics.frame,
    initialWindowMetrics: initialMetrics,
  };
});

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: (props: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props} />,
  };
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockSwipeable = React.forwardRef(
    ({ children }: { children: React.ReactNode }, _ref: any) => (
      <View>{children}</View>
    ),
  );
  MockSwipeable.displayName = 'Swipeable';

  const mockGesture = {
    onStart: jest.fn().mockReturnThis(),
    onUpdate: jest.fn().mockReturnThis(),
    onEnd: jest.fn().mockReturnThis(),
    onFinalize: jest.fn().mockReturnThis(),
    onBegin: jest.fn().mockReturnThis(),
    onTouchesDown: jest.fn().mockReturnThis(),
    onTouchesMove: jest.fn().mockReturnThis(),
    onTouchesUp: jest.fn().mockReturnThis(),
    onTouchesCancelled: jest.fn().mockReturnThis(),
    minDistance: jest.fn().mockReturnThis(),
    maxPointers: jest.fn().mockReturnThis(),
  };

  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Swipeable: MockSwipeable,
    TouchableOpacity: (props: any) => <View {...props} />,
    PanGestureHandler: (props: any) => <View {...props} />,
    GestureDetector: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Gesture: {
      Pan: () => mockGesture,
      Tap: () => mockGesture,
      LongPress: () => mockGesture,
      Pinch: () => mockGesture,
      Rotation: () => mockGesture,
      Fling: () => mockGesture,
      ForceTouch: () => mockGesture,
      Native: () => mockGesture,
      Raw: () => mockGesture,
      Race: (...gestures: any[]) => mockGesture,
      Simultaneous: (...gestures: any[]) => mockGesture,
      Exclusive: (...gestures: any[]) => mockGesture,
    },
    State: {},
  };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // Overwrite functions that are missing or problematic in the mock
  Reanimated.default.call = () => {};

  return {
    ...Reanimated,
    FadeIn: {
      duration: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
      damping: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
    },
    FadeOut: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
    },
    FadeInUp: {
      duration: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
      damping: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
    },
    FadeOutUp: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
    },
    ZoomIn: {
      duration: jest.fn().mockReturnThis(),
    },
    ZoomOut: {
      duration: jest.fn().mockReturnThis(),
    },
    withDelay: jest.fn((_delay, animation) => animation),
    withSpring: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
    useSharedValue: jest.fn((value) => ({ value })),
    useAnimatedStyle: jest.fn((cb: any) => cb()),
  };
});
