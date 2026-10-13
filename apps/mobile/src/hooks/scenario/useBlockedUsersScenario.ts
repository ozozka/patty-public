/** Scenario hook for blocked users management. */
import type { BlockedUser } from '@patty/contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlockedUsers, useUnblockUser } from 'src/hooks/api/useBlockApi';
import { useAlert } from 'src/hooks/ui/useAlert';

export function useBlockedUsersScenario() {
  const { t } = useTranslation();
  const alert = useAlert();

  const { data: blockedUsers = [], isLoading } = useBlockedUsers();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const handleUnblock = useCallback(
    (user: BlockedUser) => {
      alert.show(
        t('settings.unblock'),
        t('settings.unblock_confirm', { name: user.first_name }),
        [
          { text: t('common.cancel'), style: 'cancel' as const },
          {
            text: t('settings.unblock'),
            style: 'destructive' as const,
            onPress: () => unblockUser(user.id),
          },
        ],
      );
    },
    [t, alert, unblockUser],
  );

  return {
    blockedUsers,
    isLoading,
    isUnblocking,
    handleUnblock,
  };
}
