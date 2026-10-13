import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { FormPhoto } from 'src/hooks/scenario/usePetFormScenario';
import { Crop, X } from 'src/lib/icons';

/**
 * Properties for the PhotoThumbnail component.
 */
export interface PhotoThumbnailProps {
  /** The photo object containing URI and optional remote ID. */
  photo: FormPhoto;
  /** Current index in the list (used for move-left/right visibility). */
  index: number;
  /** Total number of photos in the list. */
  total: number;
  /** Callback to remove this photo from the list. Triggers Medium haptic. */
  onRemove: () => void;
  /** Callback to trigger cropping for this photo */
  onCrop?: () => void;
  /** Size variant. 'md' (120x160), 'sm' (100x120), or 'custom' for parent-controlled. */
  size?: 'sm' | 'md' | 'custom';
  /** Width when size is 'custom' */
  customWidth?: DimensionValue;
  /** Height when size is 'custom' */
  customHeight?: DimensionValue;
  /** Additional container styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable thumbnail component for pet photos with reordering and removal controls.
 * Features built-in `expo-haptics` feedback for all interactions.
 */
export function PhotoThumbnail({
  photo,
  onRemove,
  onCrop,
  size = 'md',
  customWidth,
  customHeight,
  style,
}: PhotoThumbnailProps) {
  const { theme } = useUnistyles();
  const isSmall = size === 'sm';
  const isCustom = size === 'custom';

  const containerStyle = useMemo(
    () => [
      styles.overflowHidden,
      isSmall
        ? { width: 100, height: 120, borderRadius: theme.borderRadius.md }
        : size === 'md'
          ? { width: 120, height: 160, borderRadius: theme.borderRadius.lg }
          : {},
      isCustom ? { width: customWidth, height: customHeight } : {},
      style,
    ],
    [isSmall, isCustom, customWidth, customHeight, size, theme, style],
  );

  const removeButtonStyle = useMemo(
    () => [
      styles.removeButton,
      isSmall
        ? { width: 20, height: 20, borderRadius: 10, right: 6, top: 6 }
        : {
            width: 24,
            height: 24,
            borderRadius: theme.borderRadius.sm,
            right: 6,
            top: 6,
          },
      { backgroundColor: theme.colors.ERROR },
    ],
    [isSmall, theme],
  );

  const cropButtonStyle = useMemo(
    () => [
      styles.cropButton,
      isSmall
        ? { width: 20, height: 20, borderRadius: 10, left: 6, top: 6 }
        : {
            width: 24,
            height: 24,
            borderRadius: theme.borderRadius.sm,
            left: 6,
            top: 6,
          },
      { backgroundColor: theme.colors.OVERLAY + 'CC' },
    ],
    [isSmall, theme],
  );

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: photo.uri }}
        style={styles.fullSize}
        contentFit="cover"
        transition={200}
      />
      <TouchableOpacity
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onRemove();
        }}
        style={removeButtonStyle}
        testID={`remove-photo-${photo.key}`}
      >
        <X
          size={isSmall ? 10 : 12}
          color={theme.colors.TEXT_ON_IMAGE}
          strokeWidth={3}
        />
      </TouchableOpacity>

      {onCrop && (
        <TouchableOpacity
          testID="pet-photo-crop"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCrop();
          }}
          style={cropButtonStyle}
        >
          <Crop size={isSmall ? 12 : 14} color={theme.colors.TEXT_ON_IMAGE} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  overflowHidden: {
    overflow: 'hidden',
    position: 'relative',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
