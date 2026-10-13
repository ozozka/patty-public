import { Image } from 'expo-image';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BLURHASH } from 'src/constants/blurhash';
import { Camera } from 'src/lib/icons';
import { optimizeAvatarUrl } from 'src/utils/image';

const AVATAR_SIZES = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 100,
  '2xl': 120,
} as const;

/**
 * Standardized avatar component for the application.
 * Handles loading states, placeholders, online indicators, and edit badges.
 */
export interface AvatarImageProps {
  /** Remote URL of the image. If null, a placeholder icon is shown. */
  uri?: string | null;
  /** Size preset ('sm', 'md', 'lg', 'xl', '2xl') or numeric value. */
  size?: number | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Show a darkened overlay with a camera icon. Use for legacy edit mode. */
  editable?: boolean;
  /** Optional click handler. Wraps the component in TouchableOpacity if present. */
  onPress?: () => void;
  /** Show a green online status dot. */
  isOnline?: boolean;
  /** Show a colored ring around the avatar (e.g. for premium or active stories). */
  showRing?: boolean;
  /** Custom color for the ring. Defaults to colors.PRIMARY. */
  ringColor?: string;
  /** Show a modern camera badge at the bottom-right. Preferred for profile editing. */
  showBadge?: boolean;
}

export function AvatarImage({
  uri,
  size = '2xl',
  editable = false,
  onPress,
  isOnline = false,
  showRing = false,
  ringColor,
  showBadge = false,
}: AvatarImageProps) {
  const { theme } = useUnistyles();

  let containerSize: number;
  if (typeof size === 'number') {
    containerSize = size;
  } else {
    containerSize = AVATAR_SIZES[size] ?? 120;
  }

  const innerPadding = showRing ? 3 : 0;
  const imageSize = containerSize - innerPadding * 2;

  const containerStyle = {
    width: containerSize,
    height: containerSize,
    borderRadius: containerSize / 2,
  };

  const imageContainerStyle = {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
  };

  const optimizedUri = optimizeAvatarUrl(uri);

  const content = optimizedUri ? (
    <Image
      source={{ uri: optimizedUri }}
      style={[styles.image, imageContainerStyle]}
      placeholder={BLURHASH}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View style={[styles.placeholder, imageContainerStyle]}>
      <Camera size={imageSize * 0.3} color={theme.colors.GRAY} />
    </View>
  );

  const wrapperStyle = [
    styles.container,
    containerStyle,
    showRing && {
      borderWidth: 2,
      borderColor: ringColor,
      padding: innerPadding,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  ];

  const onlineStyle = {
    width: containerSize * 0.25,
    height: containerSize * 0.25,
    borderRadius: (containerSize * 0.25) / 2,
  };

  const badgeStyle = {
    width: containerSize * 0.3,
    height: containerSize * 0.3,
    borderRadius: (containerSize * 0.3) / 2,
  };

  const MainContent = (
    <>
      {content}
      {isOnline && (
        <View
          style={[
            styles.indicator,
            styles.bottomRight,
            onlineStyle,
            styles.online,
          ]}
          testID="online-indicator"
        />
      )}
      {showBadge && (
        <View
          style={[
            styles.indicator,
            styles.bottomRight,
            badgeStyle,
            styles.badge,
          ]}
        >
          <Camera size={containerSize * 0.15} color={theme.colors.ON_PRIMARY} />
        </View>
      )}
      {editable && (
        <View
          style={[
            styles.editOverlay,
            {
              borderRadius: imageSize / 2,
              width: imageSize,
              height: imageSize,
              top: innerPadding,
              left: innerPadding,
            },
          ]}
        >
          <Camera size={imageSize * 0.25} color={theme.colors.ON_PRIMARY} />
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID="avatar-touchable"
        onPress={onPress}
        activeOpacity={0.8}
        style={wrapperStyle}
      >
        {MainContent}
      </TouchableOpacity>
    );
  }

  return (
    <View testID="avatar-container" style={wrapperStyle}>
      {MainContent}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.COMPONENT,
  },
  indicator: {
    position: 'absolute',
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  online: {
    borderWidth: theme.borderWidth.lg,
    borderColor: theme.colors.BACKGROUND,
    backgroundColor: theme.colors.SUCCESS,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidth.lg,
    borderColor: theme.colors.BACKGROUND,
    backgroundColor: theme.colors.PRIMARY,
  },
  editOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.OVERLAY,
  },
}));
