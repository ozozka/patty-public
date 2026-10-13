/**
 * Modal displayed when a mutual match is detected.
 */
import type { Pet, PetCandidate } from '@patty/contracts';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { Config } from 'src/Config';
import { MessageCircle } from 'src/lib/icons';
import type { MainStackParamList } from 'src/types/navigation';

/**
 * Props for MatchModal component.
 */
export interface MatchModalProps {
  visible: boolean;
  onClose: () => void;
  matchedPet: PetCandidate | null;
  matchId: string | null;
  userPet: Pet | null;
}

const EXCLAMATION = '!';
const AVATAR_CONTAINER_HEIGHT = 144;
const MODAL_MAX_WIDTH = 400;

/**
 * A beautiful modal to celebrate a mutual match.
 */
export function MatchModal({
  visible,
  onClose,
  matchedPet,
  matchId,
  userPet,
}: MatchModalProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const heartScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      heartScale.value = withDelay(
        Config.animation.delay.medium,
        withSpring(1),
      );
    } else {
      heartScale.value = 0;
    }
  }, [visible, heartScale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleSendMessage = useCallback(() => {
    onClose();
    if (matchId) {
      navigation.navigate('ChatDetail', { conversationId: matchId });
    }
  }, [matchId, navigation, onClose]);

  if (!matchedPet) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View
          entering={ZoomIn.duration(Config.animation.duration.regular)}
          exiting={ZoomOut.duration(Config.animation.duration.regular)}
          style={styles.modalContent}
        >
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{t('discovery.match_found')}</Text>
          </View>

          <View style={styles.subtitleWrap}>
            <Text style={styles.subtitle}>
              {t('discovery.you_matched_with')} {matchedPet.name}
              {EXCLAMATION}
            </Text>
          </View>

          <View style={styles.avatarContainer}>
            <View style={styles.avatarsRow}>
              {userPet?.photos?.[0] && (
                <View style={styles.avatarWrapperLeft}>
                  <View style={styles.avatar}>
                    <Image
                      source={{ uri: userPet.photos[0].image_url }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                </View>
              )}
              {matchedPet.photos[0] && (
                <View style={styles.avatarWrapperRight}>
                  <View style={styles.avatar}>
                    <Image
                      source={{ uri: matchedPet.photos[0] }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                </View>
              )}
            </View>

            <Animated.View style={[styles.heartIcon, heartStyle]}>
              <View style={styles.heartIconInner}>
                <MessageCircle
                  size={theme.sizes.iconLg}
                  color={theme.colors.PRIMARY}
                />
              </View>
            </Animated.View>
          </View>

          <View style={styles.buttonsContainer}>
            <ActionButton
              testID="match-modal-send-message-button"
              title={t('discovery.send_message')}
              onPress={handleSendMessage}
              style={styles.button}
              type="primary"
              icon={MessageCircle}
            />
            <ActionButton
              testID="match-modal-keep-swiping-button"
              title={t('common.keep_swiping')}
              onPress={onClose}
              style={styles.button}
              type="outline"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.TRANSPARENT_IMAGE_VIEWER,
    padding: theme.spacing.sm,
  },
  modalContent: {
    width: '100%',
    maxWidth: MODAL_MAX_WIDTH,
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.TRANSPARENT_MODAL,
    padding: theme.spacing.xl,
    ...theme.getShadow(3),
  },
  titleWrap: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.PRIMARY,
  },
  subtitleWrap: {
    marginBottom: theme.spacing.xl + theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  avatarContainer: {
    marginBottom: theme.spacing.xl + theme.spacing.md,
    width: '100%',
    height: AVATAR_CONTAINER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  avatarWrapperLeft: {
    zIndex: theme.zIndex.dropdown,
    marginRight: -20,
  },
  avatarWrapperRight: {
    marginLeft: -20,
  },
  avatar: {
    width: theme.sizes.avatarXl,
    height: theme.sizes.avatarXl,
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth['2xl'],
    borderColor: theme.colors.PRIMARY,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  heartIcon: {
    position: 'absolute',
    bottom: -10,
    zIndex: theme.zIndex.sticky,
    ...theme.getShadow(1),
  },
  heartIconInner: {
    width: theme.sizes.icon,
    height: theme.sizes.icon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.BACKGROUND,
    ...theme.getShadow(1),
  },
  buttonsContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  button: {
    marginVertical: 0,
    width: '100%',
  },
}));
