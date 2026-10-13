import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const ANIMATION_DURATION = 250;

export const stackTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  animationDuration: ANIMATION_DURATION,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

export const modalTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  animationDuration: ANIMATION_DURATION,
  gestureEnabled: true,
  gestureDirection: 'vertical',
};

export const fadeTransition: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 200,
};
