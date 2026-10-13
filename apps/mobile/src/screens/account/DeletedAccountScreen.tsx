import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useApiMutation } from 'src/hooks/api/useApiMutation';
import { useAuthScenario } from 'src/hooks/scenario/useAuthScenario';
import { useToast } from 'src/hooks/ui/useToast';
import { AuthService } from 'src/service/AuthService';
import type { MainStackParamList } from 'src/types/navigation';

export function DeletedAccountScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<MainStackParamList, 'RestoreAccount'>>();
  const { deletedAt } = route.params;
  const toast = useToast();
  const { performLogout } = useAuthScenario();

  const deletedDate = new Date(deletedAt);
  const msSinceDeletion = Date.now() - deletedDate.getTime();
  const daysSinceDeletion = Math.floor(msSinceDeletion / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysSinceDeletion);
  const isExpired = daysRemaining === 0;

  const restoreMutation = useApiMutation({
    mutationFn: () => AuthService.restoreAccount(),
    onSuccess: () => {
      toast.success(t('settings.account_restored_success'));
      void performLogout();
    },
    onError: (error: Error) => {
      if (
        error.message.includes('expired') ||
        error.message.includes('not deleted')
      ) {
        toast.error(t('settings.restore_expired_error'));
      } else {
        toast.error(t('error.common.title'));
      }
    },
  });

  return (
    <ScreenContainer
      layoutMode="scroll"
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t('settings.deleted_account_title')}</Text>

        <Text style={styles.message}>
          {t('settings.deleted_account_message', {
            date: format(deletedDate, 'PPP'),
          })}
        </Text>

        <View style={styles.card}>
          {isExpired ? (
            <Text style={styles.expiredText}>
              {t('settings.account_expired')}
            </Text>
          ) : (
            <>
              <Text style={styles.daysRemainingText}>
                {t('settings.days_remaining', { count: daysRemaining })}
              </Text>
              <View style={styles.spacerSmall} />
              <Text style={styles.warningText}>
                {t('settings.permanent_deletion_warning')}
              </Text>
            </>
          )}
        </View>

        <View style={styles.spacerLarge} />

        <View style={styles.actionsContainer}>
          {!isExpired && (
            <ActionButton
              testID="deleted-account-restore-button"
              title={t('settings.restore_account')}
              onPress={() => restoreMutation.mutate()}
              loading={restoreMutation.isPending}
            />
          )}
          <ActionButton
            testID="deleted-account-logout-button"
            title={t('auth.logout')}
            type="secondary"
            onPress={performLogout}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    padding: theme.spacing['2xl'],
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  message: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  card: {
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    padding: theme.spacing.sm,
  },
  expiredText: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.ERROR,
  },
  daysRemainingText: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.PRIMARY,
  },
  spacerSmall: {
    height: theme.borderWidth.sm,
  },
  warningText: {
    ...theme.typography.caption,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  spacerLarge: {
    height: theme.spacing['2xl'],
  },
  actionsContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
}));
