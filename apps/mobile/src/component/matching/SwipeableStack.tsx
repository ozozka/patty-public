import type { PetCandidate } from '@patty/contracts';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { DiscoveryPetCard } from './DiscoveryPetCard';

/**
 * Direction of the swipe.
 */
export type SwipeDirection = 'LIKE' | 'DISLIKE';

export interface SwipeableStackProps {
  /** Array of pet candidates to display. */
  candidates: PetCandidate[];
  /** Callback when a swipe is completed. */
  onSwipe: (candidate: PetCandidate, direction: SwipeDirection) => void;
  /** Callback when the stack becomes empty. */
  onEmpty: () => void;
  /** Callback when a card is long pressed. */
  onCardLongPress?: (pet: PetCandidate) => void;
  /** Optional test ID. */
  testID?: string;
}

/**
 * Handle for external swipe triggers.
 */
export interface SwipeableStackRef {
  swipe: (direction: SwipeDirection) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

/**
 * A Tinder-style swipeable stack for pet discovery.
 * Features smooth animations using Reanimated 3 and Gesture Handler 2.
 */
export const SwipeableStack = forwardRef<
  SwipeableStackRef,
  SwipeableStackProps
>(({ candidates, onSwipe, onEmpty, onCardLongPress, testID }, ref) => {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  // The index of the card currently on top
  const [currentIndex, setCurrentIndex] = useState(0);

  // Shared values for the top card's position and rotation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    swipe: (direction: SwipeDirection) => {
      handleSwipeComplete(direction);
    },
  }));

  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection) => {
      const candidate = candidates[currentIndex];
      if (!candidate) return;

      // Animate off screen
      const targetX =
        direction === 'LIKE' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

      translateX.value = withSpring(targetX, { damping: 20 }, () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        runOnJS(translateX.set)(0);
        runOnJS(translateY.set)(0);
        runOnJS(onSwipe)(candidate, direction);

        if (currentIndex + 1 >= candidates.length) {
          runOnJS(onEmpty)();
        }
      });
    },
    [candidates, currentIndex, onSwipe, onEmpty, translateX, translateY],
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction: SwipeDirection =
          event.translationX > 0 ? 'LIKE' : 'DISLIKE';
        runOnJS(handleSwipeComplete)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.95, 1],
      'clamp',
    );

    return {
      transform: [{ scale }],
      opacity: interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [0.5, 1],
        'clamp',
      ),
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2],
      [0, 1],
      'clamp',
    ),
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD / 2, 0],
      [1, 0],
      'clamp',
    ),
  }));

  const activeCandidate = candidates[currentIndex];
  const nextCandidate = candidates[currentIndex + 1];

  if (currentIndex >= candidates.length) return null;

  return (
    <View style={styles.container} testID={testID}>
      {/* Next Card (Background) */}
      {nextCandidate && (
        <Animated.View style={[styles.nextCard, nextCardStyle]}>
          <DiscoveryPetCard
            pet={nextCandidate}
            onLongPress={
              onCardLongPress ? () => onCardLongPress(nextCandidate) : undefined
            }
          />
        </Animated.View>
      )}

      {/* Current Card (Top) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.currentCard, animatedCardStyle, { width: CARD_WIDTH }]}
        >
          {activeCandidate && (
            <DiscoveryPetCard
              pet={activeCandidate}
              onLongPress={
                onCardLongPress
                  ? () => onCardLongPress(activeCandidate)
                  : undefined
              }
            />
          )}

          {/* Like Badge */}
          <Animated.View
            style={[
              styles.badge,
              styles.likeBadge,
              { transform: [{ rotate: '-15deg' }] },
              likeOpacityStyle,
            ]}
          >
            <Text style={[styles.badgeText, { color: theme.colors.SUCCESS }]}>
              {t('discovery.like')}
            </Text>
          </Animated.View>

          {/* Dislike Badge */}
          <Animated.View
            style={[
              styles.badge,
              styles.dislikeBadge,
              { transform: [{ rotate: '15deg' }] },
              nopeOpacityStyle,
            ]}
          >
            <Text style={[styles.badgeText, { color: theme.colors.ERROR }]}>
              {t('discovery.dislike')}
            </Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});
SwipeableStack.displayName = 'SwipeableStack';

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCard: {
    position: 'absolute',
    zIndex: 0,
  },
  currentCard: {
    position: 'absolute',
    zIndex: theme.zIndex.dropdown,
    ...theme.getShadow(2),
  },
  badge: {
    position: 'absolute',
    top: theme.spacing['4xl'],
    borderWidth: theme.borderWidth['2xl'],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  likeBadge: {
    left: theme.spacing.xl,
    borderColor: theme.colors.SUCCESS,
  },
  dislikeBadge: {
    right: theme.spacing.xl,
    borderColor: theme.colors.ERROR,
  },
  badgeText: {
    ...theme.typography.heading,
    textTransform: 'uppercase',
  },
}));
