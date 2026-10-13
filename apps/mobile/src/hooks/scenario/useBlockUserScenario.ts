/** Scenario hook for blocking a user with confirmation dialog. */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlockUser } from 'src/hooks/api/useBlockApi';
import { useAlert } from 'src/hooks/ui/useAlert';

interface BlockUserCallbacks {
  onSuccess?: () => void;
  onError?: () => void;
}

interface HandleBlockParams {
  userId: string;
  userName: string;
  callbacks?: BlockUserCallbacks;
}

export function useBlockUserScenario() {
  const { t } = useTranslation();
  const alert = useAlert();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();

  const handleBlock = useCallback(
    ({ userId, userName, callbacks }: HandleBlockParams) => {
      alert.show(
        t('profile.block'),
        t('profile.block_confirm', { name: userName }),
        [
          { text: t('common.cancel'), style: 'cancel' as const },
          {
            text: t('common.continue'),
            style: 'destructive' as const,
            onPress: () => {
              blockUser(
                { blocked_id: userId },
                {
                  onSuccess: () => callbacks?.onSuccess?.(),
                  onError: () => callbacks?.onError?.(),
                },
              );
            },
          },
        ],
      );
    },
    [t, alert, blockUser],
  );

  return {
    handleBlock,
    isBlocking,
  };
}
