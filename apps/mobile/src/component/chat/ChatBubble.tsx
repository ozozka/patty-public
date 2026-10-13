/**
 * Component for displaying a single chat message bubble.
 */
import type { Message } from '@patty/contracts';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated as RNAnimated,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AvatarImage } from 'src/component/common/AvatarImage';
import { ImageModal } from 'src/component/common/ImageModal';
import { Config } from 'src/Config';
import { BLURHASH } from 'src/constants/blurhash';
import { Check, CheckCheck, MapPin, Reply } from 'src/lib/icons';

const BUBBLE_AVATAR_SIZE = 32;
const ACTION_CONTAINER_WIDTH = 48;

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  avatar?: string;
  isLastInGroup?: boolean;
  onPressAvatar?: () => void;
  onSwipeReply?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isMine,
  avatar,
  isLastInGroup = true,
  onPressAvatar,
  onSwipeReply,
  onLongPress,
}) => {
  const { theme } = useUnistyles();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const scale = useSharedValue(0.9);
  const swipeableRef = React.useRef<Swipeable>(null);

  useEffect(() => {
    scale.value = withSpring(1);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function renderMessageContent() {
    if (message.message_type === 'image') {
      return (
        <View style={styles.imageWrap}>
          <Pressable
            testID="chat-bubble-image"
            onPress={() => setIsModalVisible(true)}
          >
            <Image
              source={{ uri: message.content }}
              style={styles.image}
              contentFit="cover"
              placeholder={BLURHASH}
              transition={200}
            />
          </Pressable>
        </View>
      );
    }

    if (message.message_type === 'location') {
      return (
        <View
          style={[
            styles.locationBubble,
            isMine ? styles.locationBubbleMine : styles.locationBubbleTheirs,
          ]}
        >
          <MapPin
            size={theme.sizes.icon}
            color={isMine ? theme.colors.ON_PRIMARY : theme.colors.PRIMARY}
          />
          <Text
            style={[
              styles.messageText,
              isMine ? styles.messageTextMine : styles.messageTextTheirs,
            ]}
          >
            {message.location_name ?? message.content}
          </Text>
        </View>
      );
    }

    return (
      <Text
        style={[
          styles.messageText,
          isMine ? styles.messageTextMine : styles.messageTextTheirs,
        ]}
      >
        {message.content}
      </Text>
    );
  }

  const getBubbleStyles = (): object[] => {
    const base: object[] = [
      styles.bubble,
      isMine ? styles.bubbleMine : styles.bubbleTheirs,
    ];
    if (!isLastInGroup) {
      base.push(isMine ? styles.bubbleMineNoTail : styles.bubbleTheirsNoTail);
    }
    return base;
  };

  const formattedTime = useMemo(
    () =>
      new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [message.created_at],
  );

  const renderReplyContext = () => {
    if (!message.replied_message) return null;

    return (
      <View
        style={[
          styles.replyBubble,
          isMine ? styles.replyBubbleMine : styles.replyBubbleTheirs,
        ]}
      >
        <View
          style={[
            styles.replyIndicator,
            {
              backgroundColor: isMine
                ? theme.colors.ON_PRIMARY
                : theme.colors.PRIMARY,
            },
          ]}
        />
        <Text
          style={[
            styles.replyText,
            isMine ? styles.replyTextMine : styles.replyTextTheirs,
          ]}
          numberOfLines={1}
        >
          {message.replied_message.message_type === 'image'
            ? '📷 Photo'
            : message.replied_message.content}
        </Text>
      </View>
    );
  };

  const renderLeftActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionContainer}>
        <RNAnimated.View style={{ transform: [{ scale }] }}>
          <Reply size={theme.sizes.icon} color={theme.colors.PRIMARY} />
        </RNAnimated.View>
      </View>
    );
  };

  const onSwipeableWillOpen = () => {
    onSwipeReply?.(message);
    swipeableRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      friction={2}
      leftThreshold={40}
    >
      <Animated.View
        entering={FadeInUp.duration(Config.animation.duration.regular)}
        style={styles.container}
      >
        <Animated.View style={styles.flex1}>
          <Animated.View style={styles.row}>
            <Animated.View style={animatedStyle}>
              <View style={styles.bubbleRow}>
                {!isMine && (
                  <View style={styles.avatarWrap}>
                    {isLastInGroup && avatar ? (
                      <TouchableOpacity
                        testID="chat-bubble-avatar"
                        onPress={onPressAvatar}
                        activeOpacity={0.7}
                      >
                        <AvatarImage uri={avatar} size={BUBBLE_AVATAR_SIZE} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.avatarPlaceholder} />
                    )}
                  </View>
                )}
                <Pressable
                  testID="chat-bubble-content"
                  onLongPress={() => onLongPress?.(message)}
                  delayLongPress={500}
                >
                  <View style={getBubbleStyles()}>
                    {renderReplyContext()}
                    {renderMessageContent()}
                    <View style={styles.timeRow}>
                      <Text
                        style={[
                          styles.timeText,
                          isMine ? styles.timeTextMine : styles.timeTextTheirs,
                        ]}
                      >
                        {formattedTime}
                      </Text>
                      {isMine && (
                        <View style={styles.statusIconWrap}>
                          {message.is_read ? (
                            <CheckCheck
                              size={theme.sizes.iconSm}
                              color={theme.colors.ON_PRIMARY}
                            />
                          ) : (
                            <Check
                              size={theme.sizes.iconSm}
                              color={theme.colors.ON_PRIMARY}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>

          <ImageModal
            visible={isModalVisible}
            imageUrl={message.content}
            onClose={() => setIsModalVisible(false)}
          />
        </Animated.View>
      </Animated.View>
    </Swipeable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    marginVertical: theme.spacing.xs,
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  bubbleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    marginRight: theme.spacing.sm,
    width: BUBBLE_AVATAR_SIZE,
    justifyContent: 'flex-end',
  },
  avatarPlaceholder: {
    width: BUBBLE_AVATAR_SIZE,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  bubbleMine: {
    backgroundColor: theme.colors.PRIMARY,
    borderBottomRightRadius: theme.borderRadius.xs,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.SURFACE_ELEVATED,
    borderBottomLeftRadius: theme.borderRadius.xs,
  },
  bubbleMineNoTail: {
    borderBottomRightRadius: theme.borderRadius.md,
  },
  bubbleTheirsNoTail: {
    borderBottomLeftRadius: theme.borderRadius.md,
  },
  imageWrap: {
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
  },
  image: {
    width: theme.sizes.avatarLg,
    height: theme.sizes.avatarLg,
  },
  locationBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  locationBubbleMine: {
    backgroundColor: `${theme.colors.ON_PRIMARY}15`,
  },
  locationBubbleTheirs: {
    backgroundColor: `${theme.colors.PRIMARY}10`,
  },
  messageText: {
    ...theme.typography.body,
  },
  messageTextMine: {
    color: theme.colors.ON_PRIMARY,
  },
  messageTextTheirs: {
    color: theme.colors.TEXT,
  },
  replyBubble: {
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  replyBubbleMine: {
    backgroundColor: `${theme.colors.ON_PRIMARY}15`,
  },
  replyBubbleTheirs: {
    backgroundColor: `${theme.colors.PRIMARY}10`,
  },
  replyIndicator: {
    marginRight: theme.spacing.sm,
    height: '100%',
    width: theme.borderWidth.sm,
    borderRadius: theme.borderRadius.xs,
  },
  replyText: {
    flex: 1,
    ...theme.typography.caption,
    fontStyle: 'italic',
  },
  replyTextMine: {
    color: theme.colors.ON_PRIMARY,
  },
  replyTextTheirs: {
    color: theme.colors.TEXT_MUTED,
  },
  timeRow: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  timeText: {
    ...theme.typography.caption,
  },
  timeTextMine: {
    color: theme.colors.ON_PRIMARY,
  },
  timeTextTheirs: {
    color: theme.colors.TEXT_MUTED,
  },
  statusIconWrap: {
    marginLeft: theme.spacing.xs,
  },
  actionContainer: {
    width: ACTION_CONTAINER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
