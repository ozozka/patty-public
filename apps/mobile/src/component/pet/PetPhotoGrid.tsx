import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { FormPhoto } from 'src/hooks/scenario/usePetFormScenario';
import { Plus } from 'src/lib/icons';

import { PhotoThumbnail } from './PhotoThumbnail';

export interface PetPhotoGridProps {
  /** Array of currently selected photos */
  photos: FormPhoto[];
  /** Callback when a placeholder is pressed to add a photo */
  onAddPhoto: () => void;
  /** Callback to remove a photo */
  onRemovePhoto: (key: string) => void;
  /** Callback to trigger cropping */
  onCropPhoto: (key: string) => void;
  /** Callback when the order of photos changes */
  onReorder: (newPhotos: FormPhoto[]) => void;
  /** Whether adding is disabled (e.g. loading) */
  isLoading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GUTTER = 24; // 2xl is 24px
const PLUS_BUTTON_SIZE_HERO = 48;
const PLUS_BUTTON_SIZE_REGULAR = 32;
const GRID_GAP = 12; // md is 12px
const GRID_WIDTH = SCREEN_WIDTH - GRID_GUTTER * 2;
const COLUMN_WIDTH = (GRID_WIDTH - GRID_GAP * 2) / 3;
const ROW_HEIGHT = COLUMN_WIDTH * 1.3;

// Positions for each of the 6 slots
const SLOT_POSITIONS = [
  {
    x: 0,
    y: 0,
    width: COLUMN_WIDTH * 2 + GRID_GAP,
    height: ROW_HEIGHT * 2 + GRID_GAP,
  }, // Hero (0) - spans 2 cols + 1 gap
  {
    x: COLUMN_WIDTH * 2 + GRID_GAP * 2,
    y: 0,
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
  }, // Slot 1
  {
    x: COLUMN_WIDTH * 2 + GRID_GAP * 2,
    y: ROW_HEIGHT + GRID_GAP,
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
  }, // Slot 2
  {
    x: 0,
    y: ROW_HEIGHT * 2 + GRID_GAP * 2,
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
  }, // Slot 3
  {
    x: COLUMN_WIDTH + GRID_GAP,
    y: ROW_HEIGHT * 2 + GRID_GAP * 2,
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
  }, // Slot 4
  {
    x: COLUMN_WIDTH * 2 + GRID_GAP * 2,
    y: ROW_HEIGHT * 2 + GRID_GAP * 2,
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
  }, // Slot 5
];

interface DraggablePhotoProps {
  photo: FormPhoto;
  index: number;
  currentSlot: number;
  totalPhotos: number;
  onRemove: () => void;
  onCrop: () => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  isAnyDragging: SharedValue<boolean>;
}

function DraggablePhoto({
  photo,
  index,
  currentSlot,
  totalPhotos,
  onRemove,
  onCrop,
  onSwap,
  isAnyDragging,
}: DraggablePhotoProps) {
  const isDragging = useSharedValue(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Position shared values based on current slot
  const targetX = useSharedValue(SLOT_POSITIONS[currentSlot]?.x ?? 0);
  const targetY = useSharedValue(SLOT_POSITIONS[currentSlot]?.y ?? 0);
  const targetW = useSharedValue(SLOT_POSITIONS[currentSlot]?.width ?? 0);
  const targetH = useSharedValue(SLOT_POSITIONS[currentSlot]?.height ?? 0);

  useEffect(() => {
    const pos = SLOT_POSITIONS[currentSlot];
    if (pos) {
      targetX.value = withSpring(pos.x);
      targetY.value = withSpring(pos.y);
      targetW.value = withSpring(pos.width);
      targetH.value = withSpring(pos.height);
    }
  }, [currentSlot, targetX, targetY, targetW, targetH]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      isAnyDragging.value = true;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Find the slot we are currently over
      const absoluteX = targetX.value + event.translationX + targetW.value / 2;
      const absoluteY = targetY.value + event.translationY + targetH.value / 2;

      let closestSlot = -1;
      let minDistance = Infinity;

      // Only check slots that have photos
      for (let i = 0; i < totalPhotos; i++) {
        if (i === currentSlot) continue;
        const pos = SLOT_POSITIONS[i];
        if (!pos) continue;

        const centerX = pos.x + pos.width / 2;
        const centerY = pos.y + pos.height / 2;
        const distance = Math.sqrt(
          Math.pow(absoluteX - centerX, 2) + Math.pow(absoluteY - centerY, 2),
        );

        if (distance < minDistance && distance < 60) {
          minDistance = distance;
          closestSlot = i;
        }
      }

      if (closestSlot !== -1) {
        runOnJS(onSwap)(currentSlot, closestSlot);
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      isAnyDragging.value = false;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: targetX.value,
    top: targetY.value,
    width: targetW.value,
    height: targetH.value,
    zIndex: isDragging.value ? 100 : 1,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isDragging.value ? 1.05 : 1) },
    ],
    opacity: withSpring(isDragging.value ? 0.9 : 1),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <PhotoThumbnail
          photo={photo}
          index={index}
          total={totalPhotos}
          onRemove={onRemove}
          onCrop={onCrop}
          size="custom"
          customWidth="100%"
          customHeight="100%"
        />
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * A drag-and-drop 3-column grid for pet photos with a large hero slot.
 */
export function PetPhotoGrid({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onCropPhoto,
  onReorder,
  isLoading,
}: PetPhotoGridProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isAnyDragging = useSharedValue(false);

  // Local state for photo order to keep dragging smooth
  const [photoOrder, setPhotoOrder] = useState<FormPhoto[]>(photos);

  useEffect(() => {
    // Sync local order when photos change externally (add/remove)
    // but only when not dragging to avoid jumping
    setPhotoOrder(photos);
  }, [photos]);

  const handleSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPhotoOrder((prev) => {
        const next = [...prev];
        const item = next[fromIndex];
        const target = next[toIndex];
        if (item && target) {
          next[fromIndex] = target;
          next[toIndex] = item;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Inform parent about reorder
          onReorder(next);
        }
        return next;
      });
    },
    [onReorder],
  );

  const renderPlaceholder = (index: number) => {
    const isHero = index === 0;
    const pos = SLOT_POSITIONS[index];
    if (!pos) return null;

    const isNextAvailable = index === photoOrder.length;

    return (
      <TouchableOpacity
        key={`placeholder-${index}`}
        testID={isNextAvailable ? 'pet-add-photo' : undefined}
        onPress={onAddPhoto}
        disabled={(isLoading ?? false) || !isNextAvailable}
        activeOpacity={0.7}
        style={[
          styles.placeholder,
          {
            left: pos.x,
            top: pos.y,
            width: pos.width,
            height: pos.height,
            borderColor: isNextAvailable
              ? theme.colors.PRIMARY
              : theme.colors.BORDER + '66',
            backgroundColor: isNextAvailable
              ? theme.colors.SURFACE_ELEVATED
              : theme.colors.SURFACE_SUNKEN,
          },
        ]}
      >
        <View
          style={[
            styles.plusContainer,
            isHero ? styles.plusContainerHero : styles.plusContainerRegular,
            {
              backgroundColor: isNextAvailable
                ? theme.colors.PRIMARY
                : theme.colors.TEXT_MUTED + '33',
            },
          ]}
        >
          <Plus
            size={isHero ? 28 : 20}
            color={
              isNextAvailable
                ? theme.colors.ON_PRIMARY
                : theme.colors.TEXT_MUTED
            }
            strokeWidth={3}
          />
        </View>
        {isHero && (
          <View style={styles.heroTextContainer}>
            <Text
              style={[
                styles.heroText,
                {
                  color: isNextAvailable
                    ? theme.colors.PRIMARY
                    : theme.colors.TEXT_MUTED,
                },
              ]}
            >
              {t('pet.add_photo')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const totalHeight = ROW_HEIGHT * 3 + GRID_GAP * 2;

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      <View style={styles.innerContainer}>
        {/* Render placeholders for all 6 slots first (as background) */}
        {[0, 1, 2, 3, 4, 5].map((idx) => renderPlaceholder(idx))}

        {/* Render draggable photos on top */}
        {photoOrder.map((photo, index) => (
          <DraggablePhoto
            key={photo.key}
            photo={photo}
            index={index}
            currentSlot={index}
            totalPhotos={photoOrder.length}
            onRemove={() => onRemovePhoto(photo.key)}
            onCrop={() => onCropPhoto(photo.key)}
            onSwap={handleSwap}
            isAnyDragging={isAnyDragging}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
  },
  innerContainer: {
    position: 'relative',
    width: '100%',
    flex: 1,
  },
  placeholder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.lg,
    borderStyle: 'dashed',
  },
  plusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusContainerHero: {
    width: PLUS_BUTTON_SIZE_HERO,
    height: PLUS_BUTTON_SIZE_HERO,
    borderRadius: theme.borderRadius.xl,
  },
  plusContainerRegular: {
    width: PLUS_BUTTON_SIZE_REGULAR,
    height: PLUS_BUTTON_SIZE_REGULAR,
    borderRadius: theme.borderRadius.lg,
  },
  heroTextContainer: {
    marginTop: theme.spacing.xs,
  },
  heroText: {
    ...theme.typography.body,
  },
}));
