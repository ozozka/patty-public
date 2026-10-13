import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ChevronLeft } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

export const HEADER_HEIGHT = 56;
const HEADER_PLACEHOLDER_WIDTH = 28;

export interface AppHeaderProps {
  /** Page title to display in center */
  title?: string;
  /** Custom element for center part */
  centerElement?: React.ReactNode;
  /** Whether to show back button on left */
  showBack?: boolean;
  /** Custom back handler. Defaults to navigation.goBack() */
  onBack?: () => void;
  /** Component to render on the right side */
  rightElement?: React.ReactNode;
  /** Transparent background for immersive pages */
  transparent?: boolean;
}

/**
 * Standard header component for all screens.
 * Ensures consistent height, padding, and typography.
 */
export function AppHeader({
  title,
  centerElement,
  showBack = false,
  onBack,
  rightElement,
  transparent = false,
}: AppHeaderProps) {
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        !transparent && styles.opaqueBorder,
        !transparent && {
          borderBottomWidth: RNStyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
            testID="header-back-button"
          >
            <ChevronLeft size={theme.sizes.iconLg} color={theme.colors.TEXT} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        {centerElement ??
          (title ? (
            <Text
              testID="header-title"
              style={styles.title}
              numberOfLines={1}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {title}
            </Text>
          ) : null)}
      </View>

      <View style={styles.sideEnd}>
        {rightElement ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

/**
 * Standard action button for header.
 */
const AppHeaderAction = ({
  icon: Icon,
  onPress,
  variant = 'primary',
  disabled = false,
  testID,
}: {
  icon: React.ElementType;
  onPress: () => void;
  variant?: 'primary' | 'destructive' | 'outline';
  disabled?: boolean;
  testID?: string;
}) => {
  const { theme } = useUnistyles();

  const getIconColor = () => {
    if (variant === 'destructive') return theme.colors.ERROR;
    if (variant === 'outline') return theme.colors.TEXT_SECONDARY;
    return theme.colors.PRIMARY;
  };

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionButton, disabled && styles.disabledOpacity]}
      activeOpacity={0.7}
    >
      <Icon size={theme.sizes.icon} color={getIconColor()} />
    </TouchableOpacity>
  );
};

// Assign the sub-component to the main component
AppHeader.Action = AppHeaderAction;

const styles = StyleSheet.create((theme) => ({
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['2xl'],
  },
  opaqueBorder: {
    borderBottomColor: theme.colors.BORDER,
    backgroundColor: theme.colors.BACKGROUND,
  },
  side: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideEnd: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  center: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.sectionHeader,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  backButton: {
    marginLeft: -theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  placeholder: {
    width: HEADER_PLACEHOLDER_WIDTH,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  disabledOpacity: {
    opacity: 0.4,
  },
}));
