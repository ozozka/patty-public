import type { BlockedUser } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppHeader } from 'src/component/common/AppHeader';
import { AvatarImage } from 'src/component/common/AvatarImage';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useBlockedUsersScenario } from 'src/hooks/scenario/useBlockedUsersScenario';

export function BlockedAccountsScreen() {
  const { t } = useTranslation();
  const { blockedUsers, isLoading, isUnblocking, handleUnblock } =
    useBlockedUsersScenario();

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.listItem}>
      <View style={styles.userInfo}>
        <AvatarImage uri={item.profile_picture_url} size={48} />
        <Text style={styles.userName}>{item.first_name}</Text>
      </View>
      <ActionButton
        title={t('settings.unblock')}
        type="outline"
        size="sm"
        onPress={() => handleUnblock(item)}
        disabled={isUnblocking}
        testID="blocked-accounts-unblock-button"
      />
    </View>
  );

  return (
    <ScreenContainer
      header={<AppHeader title={t('settings.blocked_accounts')} showBack />}
      loading={isLoading}
    >
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('settings.no_blocked_accounts')}
              </Text>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  userName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.TEXT,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_MUTED,
  },
}));
