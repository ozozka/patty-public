/**
 * Component for chat input with text, image, and location support.
 */
import type { Message } from '@patty/contracts';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { useImagePicker } from 'src/hooks/feature/useImagePicker';
import { useToast } from 'src/hooks/ui/useToast';
import { Camera, MapPin, Send } from 'src/lib/icons';

import { ReplyPreview } from './ReplyPreview';
import { TypingIndicator } from './TypingIndicator';

const TEXT_INPUT_MAX_HEIGHT = 120;
const SEND_BUTTON_WIDTH = 44;

interface ChatInputProps {
  onSend: (
    content: string,
    type: 'text' | 'image' | 'location',
    latitude?: number,
    longitude?: number,
  ) => void;
  onTyping: (isTyping: boolean) => void;
  isLoading?: boolean;
  typingUser?: string | null;
  replyingTo?: Message | null;
  onClearReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  isLoading,
  typingUser,
  replyingTo,
  onClearReply,
}) => {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useToast();
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const { pickImage } = useImagePicker({
    quality: 0.7,
    allowsEditing: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [text, isTyping, onTyping]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (!isTyping && val.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }
  };

  const handleSendText = () => {
    if (text.trim()) {
      onSend(text.trim(), 'text');
      setText('');
      setIsTyping(false);
      onTyping(false);
    }
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (!result.canceled && result.uri) {
      onSend(result.uri, 'image');
    }
  };

  const handleShareLocation = async () => {
    setIsSharingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error(t('error.location.permission_denied'));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      onSend(t('chat.location_shared'), 'location', latitude, longitude);
    } catch {
      toast.error(t('error.location.failed'));
    } finally {
      setIsSharingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      {replyingTo && onClearReply && (
        <ReplyPreview message={replyingTo} onClear={onClearReply} />
      )}
      {typingUser && (
        <View style={styles.typingContainer}>
          <View style={styles.typingTextWrap}>
            <Text style={styles.typingText}>
              {t('chat.user_is_typing', { user: typingUser })}
            </Text>
          </View>
          {process.env.NODE_ENV !== 'test' && <TypingIndicator />}
        </View>
      )}
      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity
          testID="chat-input-camera-button"
          onPress={() => void handlePickImage()}
          activeOpacity={0.7}
        >
          <View style={styles.iconButton}>
            <Camera size={theme.sizes.icon} color={theme.colors.PRIMARY} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          testID="chat-input-location-button"
          onPress={() => void handleShareLocation()}
          activeOpacity={0.7}
          disabled={isSharingLocation}
        >
          <View style={styles.locationButton}>
            <MapPin
              size={theme.sizes.icon}
              color={
                isSharingLocation
                  ? theme.colors.TEXT_MUTED
                  : theme.colors.PRIMARY
              }
            />
          </View>
        </TouchableOpacity>
        <TextInput
          testID="chat-input-text"
          value={text}
          onChangeText={handleTextChange}
          style={styles.textInput}
          placeholder={t('common.type_message')}
          placeholderTextColor={theme.colors.TEXT_MUTED}
          multiline
          autoCapitalize="sentences"
          autoCorrect={false}
        />
        <ActionButton
          testID="chat-input-send-button"
          onPress={handleSendText}
          loading={isLoading}
          icon={Send}
          style={styles.sendButton}
          disabled={!text.trim()}
          size="sm"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  typingTextWrap: {
    marginRight: theme.spacing.xs,
  },
  typingText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    color: theme.colors.TEXT_MUTED,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: theme.borderWidth.sm,
    borderTopColor: theme.colors.BORDER_LIGHT,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  iconButton: {
    paddingBottom: theme.spacing.xs,
  },
  locationButton: {
    marginLeft: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  textInput: {
    flex: 1,
    maxHeight: TEXT_INPUT_MAX_HEIGHT,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.TRANSPARENT_INPUT,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  sendButton: {
    marginBottom: 0,
    width: SEND_BUTTON_WIDTH,
  },
}));
