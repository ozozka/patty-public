/**
 * Component for displaying a preview of the message being replied to.
 */
import type { Message } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Reply, X } from 'src/lib/icons';

interface ReplyPreviewProps {
  message: Message;
  onClear: () => void;
}

export function ReplyPreview({ message, onClear }: ReplyPreviewProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const isImage = message.message_type === 'image';

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.replyIconWrap}>
            <Reply size={theme.sizes.iconSm} color={theme.colors.PRIMARY} />
          </View>
          <Text style={styles.replyLabel}>{t('chat.replying_to')}</Text>
        </View>
        <Text style={styles.messageText} numberOfLines={1}>
          {isImage ? t('common.no_image') : message.content}
        </Text>
      </View>
      <TouchableOpacity testID="reply-preview-clear" onPress={onClear}>
        <View style={styles.closeButton}>
          <X size={theme.sizes.icon} color={theme.colors.TEXT_MUTED} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    padding: theme.spacing.md,
  },
  indicator: {
    marginRight: theme.spacing.md,
    height: '100%',
    width: theme.borderWidth.sm,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.PRIMARY,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  replyIconWrap: {
    marginRight: theme.spacing.xs,
  },
  replyLabel: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    color: theme.colors.PRIMARY,
  },
  messageText: {
    ...theme.typography.bodySmall,
    color: theme.colors.TEXT,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
}));
