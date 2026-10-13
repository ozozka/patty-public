/**
 * Standard container component for screens.
 */

import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, RefreshControl, View } from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { HEADER_HEIGHT } from './AppHeader';
import { KeyboardShift } from './KeyboardShift';

/**
 * Layout modes for the screen container.
 * static: No scrolling, no keyboard shifting. (e.g. Discovery, Empty States)
 * keyboard-aware: Auto-scrolling to focused input. (e.g. Forms, Register)
 * list: For Chat and Feeds. Managed by FlashList/FlatList.
 */
export type LayoutMode = 'static' | 'keyboard-aware' | 'list' | 'scroll';

/**
 * Props for ScreenContainer component.
 */
export interface ScreenContainerProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  center?: boolean;
  /**
   * Layout mode for the screen.
   * Defaults to 'static'.
   */
  layoutMode?: LayoutMode;
  /**
   * Distance between the bottom of the screen and the input.
   */
  keyboardOffset?: number;
  /**
   * Extra space between keyboard and focused input.
   * Defaults to 40 for 'keyboard-aware'.
   */
  breathingRoom?: number;
  /**
   * Show loading indicator centered in the container.
   * When true, children are not rendered.
   */
  loading?: boolean;
  /** Callback for pull-to-refresh */
  onRefresh?: () => void;
  /** Current refreshing state */
  refreshing?: boolean;
  /**
   * Whether to apply safe area insets as padding.
   * Defaults to true. Set to false for fullscreen backgrounds.
   */
  useSafeArea?: boolean;
  /**
   * Optional background component to render behind the content.
   * Renders absolutely and does not shift with the keyboard.
   */
  background?: React.ReactNode;
  /**
   * Optional header component to render at the top of the screen.
   * Does not shift with the keyboard.
   */
  header?: React.ReactNode;
  /**
   * Optional accessory bar to render above the keyboard.
   * Only applied in 'keyboard-aware' mode.
   */
  accessoryBar?: React.ReactNode;
  /**
   * Legacy prop, maps to 'scroll' layoutMode.
   */
  scroll?: boolean;
  /**
   * Optional test ID for the container.
   */
  testID?: string;
}

/**
 * A wrapper component that handles SafeArea, layout modes, and keyboard synchronization.
 */
const ScreenContainer = ({
  children,
  style,
  contentContainerStyle,
  center = false,
  layoutMode = 'static',
  keyboardOffset = 0,
  breathingRoom = 40,
  loading = false,
  onRefresh,
  refreshing = false,
  useSafeArea = true,
  background,
  header,
  accessoryBar,
  scroll,
  testID = 'screen-container',
}: ScreenContainerProps) => {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  // Resolve mode (with backward compatibility)
  const mode = scroll ? 'scroll' : layoutMode;

  const containerStyle = useSafeArea
    ? {
        paddingTop: insets.top,
        paddingBottom: mode === 'static' ? insets.bottom : 0,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    : undefined;

  const renderContent = () => {
    const bottomInset = useSafeArea
      ? (initialWindowMetrics?.insets.bottom ?? insets.bottom)
      : 0;

    const refreshControl = onRefresh ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.colors.PRIMARY}
        colors={[theme.colors.PRIMARY]}
      />
    ) : undefined;

    switch (mode) {
      case 'keyboard-aware':
      case 'scroll':
        return (
          <KeyboardShift
            verticalOffset={keyboardOffset + (header ? HEADER_HEIGHT : 0)}
            bottomOffset={breathingRoom + bottomInset}
            accessoryBar={accessoryBar}
            center={center}
            style={style}
            contentContainerStyle={contentContainerStyle}
            contentPaddingBottom={theme.spacing.xl}
            refreshControl={refreshControl}
          >
            {children}
          </KeyboardShift>
        );

      case 'list':
        return (
          <KeyboardShift enabled={false} style={style} center={center}>
            {children}
          </KeyboardShift>
        );

      case 'static':
      default:
        return (
          <View
            style={[
              styles.content,
              center && styles.center,
              style,
              useSafeArea ? { paddingBottom: insets.bottom } : undefined,
            ]}
          >
            {children}
          </View>
        );
    }
  };

  return (
    <View style={[styles.root, containerStyle]} testID={testID}>
      {background && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {background}
        </View>
      )}
      {header && <View style={styles.headerWrap}>{header}</View>}
      {loading ? (
        <View style={[styles.content, styles.center]}>
          <ActivityIndicator color={theme.colors.PRIMARY} size="large" />
        </View>
      ) : (
        renderContent()
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.BACKGROUND,
  },
  content: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWrap: {
    zIndex: theme.zIndex.dropdown,
    width: '100%',
  },
}));

export { ScreenContainer };
