/** Source file for ChatListScreen. */
import type { Match } from '@patty/contracts';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { AvatarImage } from 'src/component/common/AvatarImage';
import { EmptyState } from 'src/component/common/EmptyState';
import { ListItem } from 'src/component/common/ListItem';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { TypedFlashList } from 'src/component/common/TypedFlashList';
import { Config } from 'src/Config';
import { useChatListScenario } from 'src/hooks/scenario/useChatListScenario';
import { useTheme } from 'src/hooks/ui/useTheme';
import { MessageSquareOff } from 'src/lib/icons';
import type { MainStackParamList } from 'src/types/navigation';
import { formatTimeAgo } from 'src/utils/date';
import { androidTextProps } from 'src/utils/platform';

const NEW_MATCHES_LIST_HEIGHT = 100;
const MATCH_ITEM_WIDTH = 85;

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export function ChatListScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const navigation = useNavigation<NavigationProp>();
  const { conversations, newMatches, isLoading, refreshConversations } =
    useChatListScenario();

  const renderNewMatch = ({ item, index }: { item: Match; index: number }) => {
    const otherUser = item.other_user;
    if (!otherUser) return null;

    return (
      <Animated.View
        entering={FadeInDown.delay(
          index * Config.animation.delay.stagger,
        ).duration(Config.animation.duration.medium)}
      >
        <TouchableOpacity
          testID="chat-list-item"
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('ChatDetail', {
              conversationId: item.id,
              otherUser: otherUser,
            })
          }
        >
          <View style={styles.newMatchItem}>
            <AvatarImage
              uri={otherUser.profile_picture_url}
              size={70}
              showRing={true}
              ringColor={colors.PRIMARY}
              isOnline={item.is_online}
            />
            <View style={styles.newMatchNameWrap}>
              <Text
                style={styles.newMatchName}
                numberOfLines={1}
                {...androidTextProps}
                allowFontScaling={false}
              >
                {otherUser.first_name}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderConversation = ({
    item,
    index,
  }: {
    item: Match;
    index: number;
  }) => {
    const otherUser = item.other_user;
    if (!otherUser) return null;

    return (
      <Animated.View
        entering={FadeInDown.delay(
          index * Config.animation.delay.stagger +
            Config.animation.delay.medium,
        ).duration(Config.animation.duration.medium)}
      >
        <ListItem
          title={otherUser.first_name}
          subtitle={item.last_message?.content ?? undefined}
          rightSubtitle={formatTimeAgo(
            item.last_message?.created_at ?? item.created_at,
          )}
          avatar={otherUser.profile_picture_url ?? undefined}
          verified={otherUser.phone_verified}
          isOnline={item.is_online}
          badge={Number(item.unread_count)}
          onPress={() =>
            navigation.navigate('ChatDetail', {
              conversationId: item.id,
              otherUser: otherUser,
            })
          }
        />
      </Animated.View>
    );
  };

  return (
    <ScreenContainer
      testID="screen.chat-list"
      loading={isLoading && conversations.length === 0}
      scroll={false}
      onRefresh={refreshConversations}
      refreshing={isLoading && conversations.length > 0}
      header={<AppHeader title={t('chat.messages')} />}
    >
      <View style={styles.newMatchesSection}>
        <View style={styles.sectionHeaderWrap}>
          <Text
            style={styles.sectionHeader}
            {...androidTextProps}
            allowFontScaling={false}
          >
            {t('chat.new_matches')}
          </Text>
        </View>
        <View style={styles.newMatchesListContainer}>
          <TypedFlashList
            horizontal
            data={newMatches}
            renderItem={renderNewMatch}
            keyExtractor={(item: Match) => item.id}
            estimatedItemSize={85}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newMatchesContent}
            ListEmptyComponent={
              <View style={styles.emptyMatchWrap}>
                <Text
                  style={styles.emptyMatchText}
                  {...androidTextProps}
                  allowFontScaling={false}
                >
                  {t('chat.no_new_matches')}
                </Text>
              </View>
            }
          />
        </View>
      </View>

      <View style={styles.conversationsSection}>
        {conversations.length === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              icon={MessageSquareOff}
              title={t('chat.no_messages_yet')}
              subtitle={t('chat.start_conversation')}
              onAction={refreshConversations}
            />
          </View>
        ) : (
          <TypedFlashList
            data={conversations}
            keyExtractor={(item: Match) => item.id}
            renderItem={renderConversation}
            estimatedItemSize={80}
            contentContainerStyle={styles.conversationsContent}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  newMatchesSection: {
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
    paddingVertical: theme.spacing.lg,
  },
  sectionHeaderWrap: {
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.lg,
  },
  sectionHeader: {
    ...theme.typography.sectionHeader,
    color: theme.colors.TEXT,
  },
  newMatchesListContainer: {
    height: NEW_MATCHES_LIST_HEIGHT,
  },
  newMatchesContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  newMatchItem: {
    marginHorizontal: theme.spacing.xs,
    width: MATCH_ITEM_WIDTH,
    alignItems: 'center',
  },
  newMatchNameWrap: {
    marginTop: theme.spacing.xs,
  },
  newMatchName: {
    ...theme.typography.caption,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  emptyMatchWrap: {
    marginLeft: theme.spacing.lg,
  },
  emptyMatchText: {
    ...theme.typography.bodySmall,
    fontStyle: 'italic',
    color: theme.colors.TEXT_MUTED,
  },
  conversationsSection: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationsContent: {
    paddingBottom: theme.spacing['2xl'],
  },
}));
