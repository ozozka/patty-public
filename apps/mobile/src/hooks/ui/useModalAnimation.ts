import { useCallback, useEffect, useRef } from 'react';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Config } from 'src/Config';

const SCREEN_HEIGHT = Config.constants.WINDOW_HEIGHT;
const ANIMATION_DURATION = Config.animation.duration.fast;

interface UseModalAnimationOptions {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Initial translateY value (default: SCREEN_HEIGHT for bottom sheets) */
  initialTranslateY?: number;
}

interface UseModalAnimationReturn {
  /** Animated style for the modal container (transform: translateY) */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Animated style for the backdrop (opacity) */
  backdropStyle: ReturnType<typeof useAnimatedStyle>;
  /** Function to trigger close animation */
  handleClose: () => void;
  /** Shared value for translateY - can be used for gestures */
  translateY: ReturnType<typeof useSharedValue<number>>;
}

export function useModalAnimation({
  visible,
  onClose,
  initialTranslateY = SCREEN_HEIGHT,
}: UseModalAnimationOptions): UseModalAnimationReturn {
  const isMounted = useRef(true);
  const translateY = useSharedValue(initialTranslateY);
  const backdropOpacity = useSharedValue(0);

  const closeWithCallback = useCallback(() => {
    if (isMounted.current) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION });
    } else {
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
      translateY.value = withTiming(
        initialTranslateY,
        { duration: ANIMATION_DURATION },
        () => {
          if (isMounted.current) {
            runOnJS(closeWithCallback)();
          }
        },
      );
    }
  }, [
    visible,
    translateY,
    backdropOpacity,
    initialTranslateY,
    closeWithCallback,
  ]);

  const handleClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    translateY.value = withTiming(
      initialTranslateY,
      { duration: ANIMATION_DURATION },
      () => {
        if (isMounted.current) {
          runOnJS(closeWithCallback)();
        }
      },
    );
  }, [translateY, backdropOpacity, initialTranslateY, closeWithCallback]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return {
    animatedStyle,
    backdropStyle,
    handleClose,
    translateY,
  };
}
