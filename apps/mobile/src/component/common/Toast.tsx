import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Config } from 'src/Config';
import { AlertCircle, CheckCircle2, Info } from 'src/lib/icons';
import { useUIStore } from 'src/store/useUIStore';

/**
 * Global Toast component that renders at the top of the screen.
 * Managed by useUIStore.
 */
export function Toast() {
  const visible = useUIStore((s) => s.toastVisible);
  const message = useUIStore((s) => s.toastMessage);
  const type = useUIStore((s) => s.toastType);
  const hideToast = useUIStore((s) => s.hideToast);

  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      hideToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [visible, hideToast]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <CheckCircle2 size={theme.sizes.icon} color={theme.colors.SUCCESS} />
        );
      case 'error':
        return (
          <AlertCircle size={theme.sizes.icon} color={theme.colors.ERROR} />
        );
      case 'info':
        return <Info size={theme.sizes.icon} color={theme.colors.PRIMARY} />;
    }
  };

  const getBorderStyle = () => {
    switch (type) {
      case 'success':
        return styles.borderSuccess;
      case 'error':
        return styles.borderError;
      case 'info':
        return styles.borderPrimary;
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp.duration(Config.animation.duration.regular)}
      style={[
        styles.container,
        getBorderStyle(),
        { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>{getIcon()}</View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: 'absolute',
    left: theme.spacing['2xl'],
    right: theme.spacing['2xl'],
    zIndex: theme.zIndex.max,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: theme.borderWidth['2xl'],
    backgroundColor: theme.colors.TRANSPARENT_TOAST,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.getShadow(2),
  },
  borderSuccess: {
    borderLeftColor: theme.colors.SUCCESS,
  },
  borderError: {
    borderLeftColor: theme.colors.ERROR,
  },
  borderPrimary: {
    borderLeftColor: theme.colors.PRIMARY,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    flex: 1,
    color: theme.colors.TEXT,
  },
}));
