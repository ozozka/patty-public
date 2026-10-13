import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useBlockUserScenario } from 'src/hooks/scenario/useBlockUserScenario';
import { useToast } from 'src/hooks/ui/useToast';
import { useUIStore } from 'src/store/useUIStore';
import { logger } from 'src/utils/logger';

const MENU_MIN_WIDTH = 200;

export interface OverflowMenuProps {
  userId: string;
  userName: string;
  onClose: () => void;
  position: { x: number; y: number };
}

export function OverflowMenu({
  userId,
  userName,
  onClose,
  position,
}: OverflowMenuProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const toast = useToast();
  const { handleBlock } = useBlockUserScenario();
  const openReport = useUIStore((s) => s.openReport);

  const handleBlockPress = () => {
    onClose();
    handleBlock({
      userId,
      userName,
      callbacks: {
        onSuccess: () => toast.success(t('profile.block_success')),
        onError: () => toast.error(t('error.generic.internal_error')),
      },
    });
  };

  const handleReport = () => {
    onClose();
    openReport({ type: 'account', accountId: userId });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `patty://profile/${userId}`,
      });
      onClose();
    } catch (error) {
      logger.error('Error sharing:', { error });
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`patty://profile/${userId}`);
    onClose();
    toast.success(t('profile.link_copied'));
  };

  return (
    <View style={[styles.container, { top: position.y, right: position.x }]}>
      <View>
        <MenuItem
          title={t('profile.block')}
          onPress={handleBlockPress}
          textColor={theme.colors.ERROR}
        />
        <MenuItem
          title={t('profile.report')}
          onPress={handleReport}
          textColor={theme.colors.ERROR}
        />
        <MenuItem
          title={t('profile.share')}
          onPress={() => void handleShare()}
          textColor={theme.colors.TEXT}
        />
        <MenuItem
          title={t('profile.copy_link')}
          onPress={() => void handleCopyLink()}
          textColor={theme.colors.TEXT}
        />
      </View>
    </View>
  );
}

interface MenuItemProps {
  title: string;
  onPress: () => void;
  textColor: string;
}

function MenuItem({ title, onPress, textColor }: MenuItemProps) {
  return (
    <TouchableOpacity
      testID={`overflow-menu-item-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onPress={onPress}
      style={styles.menuItem}
    >
      <View style={styles.menuItemInner}>
        <View style={styles.divider} />
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemText, { color: textColor }]}>
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: 'absolute',
    zIndex: theme.zIndex.modal,
    minWidth: MENU_MIN_WIDTH,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.SURFACE,
    ...theme.getShadow(4),
  },
  menuItem: {
    flex: 1,
  },
  menuItemInner: {
    flex: 1,
  },
  divider: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: 0,
    height: theme.borderWidth.sm,
    backgroundColor: theme.colors.BORDER,
  },
  menuItemContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  menuItemText: {
    ...theme.typography.body,
  },
}));
