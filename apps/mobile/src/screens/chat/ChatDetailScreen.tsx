/** Source file for ChatDetailScreen. */
import type { Account, Message } from '@patty/contracts';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import {
  KeyboardStickyView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ChatBubble } from 'src/component/chat/ChatBubble';
import { ChatInput } from 'src/component/chat/ChatInput';
import { AppHeader } from 'src/component/common/AppHeader';
import { AvatarImage } from 'src/component/common/AvatarImage';
import { ListItem } from 'src/component/common/ListItem';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { TypedFlashList } from 'src/component/common/TypedFlashList';
import { useBlockedUsers } from 'src/hooks/api/useBlockApi';
import { useUnmatch } from 'src/hooks/api/useMatchingApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import { useBlockUserScenario } from 'src/hooks/scenario/useBlockUserScenario';
import { useMessagingScenario } from 'src/hooks/scenario/useMessagingScenario';
import { useAlert } from 'src/hooks/ui/useAlert';
import { useToast } from 'src/hooks/ui/useToast';
import {
  BadgeCheck,
  Ban,
  Flag,
  MoreVertical,
  Phone,
  Trash2,
} from 'src/lib/icons';
import { getChatService } from 'src/service/ChatService';
import { useChatStore } from 'src/store/useChatStore';
import { useUIStore } from 'src/store/useUIStore';
import type { MainStackParamList } from 'src/types/navigation';
import { formatMessageDate } from 'src/utils/date';

const DateSeparator = ({ date }: { date: string | Date }) => {
  return (
    <View style={separatorStyles.container}>
      <View style={separatorStyles.line} />
      <View style={separatorStyles.textWrap}>
        <Text style={separatorStyles.text}>{formatMessageDate(date)}</Text>
      </View>
      <View style={separatorStyles.line} />
    </View>
  );
};

const separatorStyles = StyleSheet.create((theme) => ({
  container: {
    marginVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  line: {
    height: theme.borderWidth.sm,
    flex: 1,
    backgroundColor: theme.colors.BORDER_LIGHT,
  },
  textWrap: {
    marginHorizontal: theme.spacing.md,
  },
  text: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.TEXT_MUTED,
  },
}));

export function ChatDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { info, success, error: toastError } = useToast();
  const { show: showAlert } = useAlert();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const { data: user } = useProfile();
  const userId = user?.id;
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const { height: keyboardHeightValue } = useReanimatedKeyboardAnimation();

  const absKeyboardHeight = useDerivedValue(() => {
    return Math.abs(keyboardHeightValue.value);
  }, [keyboardHeightValue]);

  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      height: absKeyboardHeight.value,
    };
  }, [absKeyboardHeight]);

  const route =
    useRoute<
      RouteProp<
        { params: { conversationId: string; otherUser?: Account } },
        'params'
      >
    >();
  const { conversationId, otherUser } = route.params;

  // Handle if match is deleted by the other user while on this screen
  useEffect(() => {
    const unsubscribe = getChatService().subscribe((chatEvent) => {
      if (
        chatEvent.type === 'EVENT' &&
        chatEvent.event.type === 'MatchDeleted' &&
        chatEvent.event.payload.match_id === conversationId
      ) {
        info(t('matching.unmatch_success'));
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('MainTabs');
        }
      }
    });

    return unsubscribe;
  }, [conversationId, navigation, info, t]);
  const {
    messages,
    isLoading,
    sendMessage,
    isSending,
    sendTyping,
    typingUser,
    replyingTo,
    setReplyingTo,
    clearReply,
  } = useMessagingScenario(conversationId, otherUser?.first_name);

  const { mutate: unmatch } = useUnmatch();
  const { handleBlock: blockUserHandler } = useBlockUserScenario();
  const { data: blockedUsers = [] } = useBlockedUsers();
  const openReport = useUIStore((s) => s.openReport);
  const [menuVisible, setMenuVisible] = useState(false);

  const isBlocked = useMemo(
    () => otherUser && blockedUsers.some((u) => u.id === otherUser.id),
    [otherUser, blockedUsers],
  );

  const isOnline = otherUser?.id ? onlineUsers.includes(otherUser.id) : false;

  const statusText = useMemo(() => {
    if (typingUser) return t('chat.typing');
    if (isOnline) return t('chat.online');
    return null;
  }, [typingUser, isOnline, t]);

  const goToUserProfile = () => {
    if (otherUser) {
      navigation.navigate('Profile', { userId: otherUser.id });
    }
  };

  const handleMore = () => {
    setMenuVisible(true);
  };

  const handleUnmatch = () => {
    setMenuVisible(false);
    showAlert(t('matching.unmatch'), t('matching.unmatch_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          unmatch(conversationId, {
            onSuccess: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs');
              }
            },
          });
        },
      },
    ]);
  };

  const handleBlock = () => {
    setMenuVisible(false);
    if (!otherUser) return;
    blockUserHandler({
      userId: otherUser.id,
      userName: otherUser.first_name,
      callbacks: {
        onSuccess: () => {
          success(t('profile.block_success'));
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs');
          }
        },
        onError: () => toastError(t('error.generic.internal_error')),
      },
    });
  };

  const handleReport = () => {
    setMenuVisible(false);
    if (otherUser) {
      openReport({ type: 'account', accountId: otherUser.id });
    }
  };

  return (
    <ScreenContainer
      loading={isLoading}
      layoutMode="list"
      header={
        <AppHeader
          showBack
          centerElement={
            <TouchableOpacity
              onPress={goToUserProfile}
              activeOpacity={0.7}
              testID="chat-detail-avatar"
            >
              <View style={styles.headerRow}>
                {otherUser?.profile_picture_url && (
                  <View style={styles.avatarWrap}>
                    <AvatarImage
                      uri={otherUser.profile_picture_url}
                      size={36}
                      isOnline={isOnline}
                    />
                  </View>
                )}
                <View style={styles.headerTextContainer}>
                  <View style={styles.nameRow}>
                    <Text style={styles.headerName} numberOfLines={1}>
                      {otherUser?.first_name ?? t('navigation.chat')}
                    </Text>
                    {otherUser?.phone_verified && (
                      <View style={styles.verifiedBadge}>
                        <BadgeCheck
                          size={theme.sizes.iconSm}
                          color={theme.colors.PRIMARY}
                        />
                      </View>
                    )}
                  </View>
                  {statusText && (
                    <View style={styles.statusWrap}>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: typingUser
                              ? theme.colors.PRIMARY
                              : theme.colors.TEXT_MUTED,
                          },
                        ]}
                      >
                        {statusText}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          }
          rightElement={
            <TouchableOpacity onPress={handleMore} testID="chat.more_button">
              <View style={styles.moreButtonWrap}>
                <MoreVertical
                  size={theme.sizes.icon}
                  color={theme.colors.PRIMARY}
                />
              </View>
            </TouchableOpacity>
          }
        />
      }
    >
      <TypedFlashList
        data={messages}
        inverted
        style={styles.flex1}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item: Message) => item.id}
        estimatedItemSize={100}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<Animated.View style={animatedFooterStyle} />}
        renderItem={({ item, index }: { item: Message; index: number }) => {
          const nextMessage = messages[index + 1];
          const prevMessage = messages[index - 1];

          const isLastInGroup =
            !prevMessage || prevMessage.sender_id !== item.sender_id;

          const itemDate = new Date(item.created_at).toDateString();
          const nextDate = nextMessage
            ? new Date(nextMessage.created_at).toDateString()
            : null;
          const showSeparator = itemDate !== nextDate;

          return (
            <>
              <ChatBubble
                message={item}
                isMine={item.sender_id === userId}
                avatar={otherUser?.profile_picture_url ?? undefined}
                isLastInGroup={isLastInGroup}
                onPressAvatar={goToUserProfile}
                onSwipeReply={setReplyingTo}
                onLongPress={
                  item.sender_id !== userId
                    ? (msg) =>
                        openReport({
                          type: 'message',
                          messageId: msg.id,
                          accountId: msg.sender_id,
                        })
                    : undefined
                }
              />
              {showSeparator && <DateSeparator date={item.created_at} />}
            </>
          );
        }}
      />
      <View>
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          {isBlocked ? (
            <View style={styles.blockedBanner}>
              <Text style={styles.blockedText}>{t('chat.blocked_banner')}</Text>
            </View>
          ) : (
            <ChatInput
              onSend={(content, type, latitude, longitude) =>
                void sendMessage(content, type, latitude, longitude)
              }
              onTyping={sendTyping}
              isLoading={isSending}
              typingUser={typingUser}
              replyingTo={replyingTo}
              onClearReply={clearReply}
            />
          )}
        </KeyboardStickyView>
      </View>

      <ModalContainer
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        maxHeight="30%"
        title={otherUser?.first_name ?? t('navigation.chat')}
        showCloseButton={false}
      >
        {otherUser?.phone_number && (
          <ListItem
            title={t('profile.phone')}
            icon={Phone}
            iconColor={theme.colors.TEXT}
            onPress={() => {
              setMenuVisible(false);
              void Linking.openURL(`tel:${otherUser.phone_number}`);
            }}
          />
        )}
        <ListItem
          title={t('profile.report')}
          icon={Flag}
          iconColor={theme.colors.ERROR}
          onPress={handleReport}
          titleStyle={styles.destructiveTitle}
        />
        <ListItem
          title={t('profile.block')}
          icon={Ban}
          iconColor={theme.colors.ERROR}
          onPress={handleBlock}
          titleStyle={styles.destructiveTitle}
        />
        <ListItem
          title={t('matching.unmatch')}
          icon={Trash2}
          iconColor={theme.colors.ERROR}
          onPress={handleUnmatch}
          titleStyle={styles.destructiveTitle}
        />
      </ModalContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: theme.spacing.md,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    ...theme.typography.button,
    color: theme.colors.TEXT,
  },
  verifiedBadge: {
    marginLeft: theme.spacing.xs,
  },
  statusWrap: {
    marginTop: -2,
  },
  statusText: {
    ...theme.typography.caption,
  },
  moreButtonWrap: {
    marginRight: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  blockedBanner: {
    alignItems: 'center',
    backgroundColor: theme.colors.SURFACE,
    padding: theme.spacing.sm,
  },
  blockedText: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_MUTED,
  },
  destructiveTitle: {
    ...theme.typography.button,
    color: theme.colors.ERROR,
  },
}));
