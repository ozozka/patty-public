/**
 * Unified modal container using @gorhom/bottom-sheet.
 * Provides gesture-driven bottom sheet with smooth animations.
 */
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { X } from 'src/lib/icons';

export type ModalKeyboardMode = 'none' | 'avoid' | 'interactive';

export interface ModalContainerProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  keyboardMode?: ModalKeyboardMode;
  showBackdrop?: boolean;
  backdropColor?: string;
  closeOnBackdropPress?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  animationType?: 'none' | 'slide' | 'fade';
  testID?: string;
  /** Title to display in the header */
  title?: string;
  /** Show close button in header */
  showCloseButton?: boolean;
}

export function ModalContainer({
  visible,
  onRequestClose,
  children,
  maxHeight = '70%',
  keyboardMode = 'none',
  showBackdrop = true,
  backdropColor: _backdropColor,
  closeOnBackdropPress = true,
  style,
  contentContainerStyle,
  title,
  showCloseButton = true,
  testID = '',
}: ModalContainerProps) {
  const { theme } = useUnistyles();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => {
    const percentValue = parseInt(maxHeight.replace('%', ''), 10);
    const screenHeight = Dimensions.get('screen').height;
    const pixelValue = Math.round(screenHeight * (percentValue / 100));
    return [pixelValue];
  }, [maxHeight]);

  const keyboardBehavior =
    keyboardMode === 'none'
      ? undefined
      : keyboardMode === 'interactive'
        ? 'interactive'
        : 'extend';

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior={closeOnBackdropPress ? 'close' : 'none'}
      />
    ),
    [closeOnBackdropPress],
  );

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    onRequestClose();
  }, [onRequestClose]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={handleDismiss}
      enablePanDownToClose={closeOnBackdropPress}
      enableDynamicSizing={false}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={{ backgroundColor: theme.colors.BORDER }}
      backgroundStyle={[
        styles.background,
        { backgroundColor: theme.colors.BACKGROUND },
      ]}
      containerStyle={contentContainerStyle}
      style={style}
      backdropComponent={showBackdrop ? renderBackdrop : undefined}
    >
      <BottomSheetScrollView style={styles.scrollView}>
        {(title ?? showCloseButton) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {showCloseButton && (
              <TouchableOpacity
                testID={testID ? `${testID}-close` : 'modal-close'}
                onPress={onRequestClose}
                style={styles.closeButton}
                hitSlop={15}
              >
                <X size={theme.sizes.icon} color={theme.colors.TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        )}
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  background: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.sectionHeader,
    flex: 1,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    padding: theme.spacing.xs,
  },
}));
