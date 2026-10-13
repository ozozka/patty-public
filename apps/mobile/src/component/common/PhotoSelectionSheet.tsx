import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { Camera, Image as ImageIcon, Images } from 'src/lib/icons';
import { logger } from 'src/utils/logger';

export interface PhotoSelectionSheetProps {
  /** Whether the sheet is visible */
  isVisible: boolean;
  /** Callback to close the sheet */
  onClose: () => void;
  /** Callback when "Take Photo" is pressed */
  onTakePhoto: () => void;
  /** Callback when "Choose from Library" is pressed */
  onChooseFromLibrary: () => void;
  /** Callback when "View Photo" is pressed (optional) */
  onViewPhoto?: () => void;
  /** Title of the sheet (optional) */
  title?: string;
  testID?: string;
}

/**
 * A bottom-sheet style modal for selecting between camera and gallery.
 */
export function PhotoSelectionSheet({
  isVisible,
  onClose,
  onTakePhoto,
  onChooseFromLibrary,
  onViewPhoto,
  title,
  testID,
}: PhotoSelectionSheetProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  return (
    <ModalContainer
      visible={isVisible}
      onRequestClose={onClose}
      title={title ?? t('pet.add_photo')}
      maxHeight="45%"
      keyboardMode="none"
    >
      <View style={styles.container}>
        {onViewPhoto && (
          <TouchableOpacity
            testID={`${testID}-view-photo`}
            style={styles.menuItem}
            onPress={() => {
              logger.info('PhotoSelectionSheet: onViewPhoto pressed');
              onClose();
              onViewPhoto();
            }}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.iconContainer}>
                <Images size={theme.sizes.icon} color={theme.colors.SUCCESS} />
              </View>
              <Text style={styles.menuItemText}>{t('common.view_photo')}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          testID={`${testID}-take-photo`}
          style={styles.menuItem}
          onPress={() => {
            logger.info('PhotoSelectionSheet: onTakePhoto pressed');
            onClose();
            onTakePhoto();
          }}
        >
          <View style={styles.menuItemContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.PRIMARY + '26' },
              ]}
            >
              <Camera size={theme.sizes.icon} color={theme.colors.PRIMARY} />
            </View>
            <Text style={styles.menuItemText}>{t('common.take_photo')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID={`${testID}-choose-from-library`}
          style={styles.menuItemNoBorder}
          onPress={() => {
            logger.info('PhotoSelectionSheet: onChooseFromLibrary pressed');
            onClose();
            onChooseFromLibrary();
          }}
        >
          <View style={styles.menuItemContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.SECONDARY + '26' },
              ]}
            >
              <ImageIcon
                size={theme.sizes.icon}
                color={theme.colors.SECONDARY}
              />
            </View>
            <Text style={styles.menuItemText}>
              {t('common.choose_from_library')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    paddingTop: theme.spacing.md,
  },
  menuItem: {
    width: '100%',
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
  },
  menuItemNoBorder: {
    width: '100%',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  iconContainer: {
    width: theme.sizes.icon,
    height: theme.sizes.icon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
}));
