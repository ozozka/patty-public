import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Check, X } from 'src/lib/icons';
import { logger } from 'src/utils/logger';

export interface ImageCropModalProps {
  /** Source image URI to crop */
  uri: string | null;
  /** Whether the modal is visible */
  isVisible: boolean;
  /** Aspect ratio [width, height], default [3, 4] */
  aspect?: [number, number];
  /** Callback when cropping is cancelled */
  onCancel: () => void;
  /** Callback when cropping is completed with new URI */
  onConfirm: (croppedUri: string) => void;
  testID?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTROL_BUTTON_SIZE = 44;

/**
 * A modal component for custom in-app image cropping with zoom and pan.
 */
export function ImageCropModal({
  uri,
  isVisible,
  aspect = [3, 4],
  onCancel,
  onConfirm,
  testID,
}: ImageCropModalProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  // Dimensions for the crop area
  const cropBoxWidth = SCREEN_WIDTH - 48; // 2xl is 24px, so 24*2 = 48
  const cropBoxHeight = (cropBoxWidth * aspect[1]) / aspect[0];

  // Animated values for image transformation
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Original image dimensions (fetched once)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        setImageSize({ width, height });
        // Initial fit: make sure image covers the crop box
        const initialScale = Math.max(
          cropBoxWidth / width,
          cropBoxHeight / height,
        );
        scale.value = initialScale;
        savedScale.value = initialScale;
      });
    }
  }, [uri, cropBoxWidth, cropBoxHeight, scale, savedScale]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = useCallback(async () => {
    if (!uri || imageSize.width === 0) return;

    // Calculate crop parameters based on zoom and pan
    const displayWidth = imageSize.width * scale.value;
    const displayHeight = imageSize.height * scale.value;

    const currentCenterX = SCREEN_WIDTH / 2 + translateX.value;
    const currentCenterY = SCREEN_HEIGHT / 2 + translateY.value;

    const cropLeft = (SCREEN_WIDTH - cropBoxWidth) / 2;
    const cropTop = (SCREEN_HEIGHT - cropBoxHeight) / 2;

    const imageLeft = currentCenterX - displayWidth / 2;
    const imageTop = currentCenterY - displayHeight / 2;

    const cropX = (cropLeft - imageLeft) / scale.value;
    const cropY = (cropTop - imageTop) / scale.value;
    const cropW = cropBoxWidth / scale.value;
    const cropH = cropBoxHeight / scale.value;

    try {
      const result = await manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.max(0, cropX),
              originY: Math.max(0, cropY),
              width: Math.min(imageSize.width, cropW),
              height: Math.min(imageSize.height, cropH),
            },
          },
          { resize: { width: 800, height: 1066 } },
        ],
        { compress: 0.8, format: SaveFormat.JPEG },
      );
      onConfirm(result.uri);
    } catch (error) {
      logger.error('Cropping failed', { error });
    }
  }, [
    uri,
    imageSize,
    scale.value,
    translateX.value,
    translateY.value,
    cropBoxWidth,
    cropBoxHeight,
    onConfirm,
  ]);

  const handleConfirmPress = () => {
    void handleConfirm();
  };

  const resetTransform = () => {
    const initialScale = Math.max(
      cropBoxWidth / imageSize.width,
      cropBoxHeight / imageSize.height,
    );
    scale.value = withSpring(initialScale);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = initialScale;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  return (
    <View
      style={[styles.container, isVisible ? styles.visible : styles.hidden]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.imageContainer}>
          {uri && (
            <GestureDetector gesture={composedGesture}>
              <Animated.Image
                source={{ uri }}
                style={[
                  { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
                  imageStyle,
                ]}
                resizeMode="contain"
              />
            </GestureDetector>
          )}
        </View>

        {/* Overlay Mask */}
        <View style={styles.overlay} pointerEvents="none">
          <View
            style={[
              styles.overlayTop,
              { height: (SCREEN_HEIGHT - cropBoxHeight) / 2 },
            ]}
          />
          <View style={styles.overlayMiddle}>
            <View
              style={[
                styles.overlaySide,
                { backgroundColor: theme.colors.OVERLAY },
              ]}
            />
            <View
              style={[
                styles.cropBox,
                {
                  width: cropBoxWidth,
                  height: cropBoxHeight,
                  borderColor: theme.colors.PRIMARY,
                },
              ]}
            />
            <View
              style={[
                styles.overlaySide,
                { backgroundColor: theme.colors.OVERLAY },
              ]}
            />
          </View>
          <View
            style={[
              styles.overlayBottom,
              { height: (SCREEN_HEIGHT - cropBoxHeight) / 2 },
            ]}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              testID={`${testID}-cancel`}
              onPress={onCancel}
              style={styles.controlButton}
            >
              <X size={theme.sizes.iconLg} color={theme.colors.TEXT_ON_IMAGE} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.TEXT_ON_IMAGE }]}>
              {t('pet.adjust_photo')}
            </Text>
            <TouchableOpacity
              testID={`${testID}-confirm`}
              onPress={handleConfirmPress}
              style={styles.controlButton}
            >
              <Check size={theme.sizes.iconLg} color={theme.colors.SUCCESS} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.resetButtonContainer}>
          <TouchableOpacity
            testID={`${testID}-reset`}
            onPress={resetTransform}
            style={styles.resetButton}
          >
            <Text
              style={[styles.resetText, { color: theme.colors.TEXT_ON_IMAGE }]}
            >
              {t('common.reset')}
            </Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: theme.zIndex.max,
    elevation: theme.zIndex.max,
  },
  visible: {
    display: 'flex',
  },
  hidden: {
    display: 'none',
  },
  gestureRoot: {
    flex: 1,
    backgroundColor: theme.colors.BACKGROUND,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    width: '100%',
    backgroundColor: theme.colors.OVERLAY,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: '100%',
  },
  overlaySide: {
    flex: 1,
  },
  cropBox: {
    borderWidth: theme.borderWidth.lg,
  },
  overlayBottom: {
    width: '100%',
    backgroundColor: theme.colors.OVERLAY,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: theme.spacing.xl + theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.heading,
  },
  resetButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing.xl + theme.spacing.lg,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: theme.colors.TEXT_MUTED + '66',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  resetText: {
    ...theme.typography.button,
  },
}));
