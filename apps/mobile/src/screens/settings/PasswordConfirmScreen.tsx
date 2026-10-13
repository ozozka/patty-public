/** Screen for password confirmation before destructive actions. */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet as RNStyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppIcon } from 'src/component/common/AppIcon';
import { Card } from 'src/component/common/Card';
import { LinkButton } from 'src/component/common/LinkButton';
import { PasswordInput } from 'src/component/common/PasswordInput';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useDeleteAccount, useVerifyPassword } from 'src/hooks/api/useAuthApi';
import { useAuthScenario } from 'src/hooks/scenario/useAuthScenario';
import { useTheme } from 'src/hooks/ui/useTheme';
import { useToast } from 'src/hooks/ui/useToast';
import type { MainStackParamList } from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'PasswordConfirm'
>;

interface PasswordConfirmFormData {
  password: string;
}

export function PasswordConfirmScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { performLogout } = useAuthScenario();

  const { mutateAsync: verifyPassword, isPending: isVerifying } =
    useVerifyPassword();
  const { mutateAsync: deleteAccount, isPending: isDeleting } =
    useDeleteAccount();

  const isLoading = isVerifying || isDeleting;

  const { control, handleSubmit, setError } = useForm<PasswordConfirmFormData>({
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (data: PasswordConfirmFormData) => {
    try {
      const isValid = await verifyPassword(data.password);
      if (!isValid) {
        setError('password', {
          message: t('settings.password_incorrect'),
        });
        return;
      }

      await deleteAccount(undefined, {
        onSuccess: () => {
          toast.success(t('settings.delete_account_success'));
          void performLogout();
        },
        onError: () => {
          toast.error(t('settings.delete_account_error'));
        },
      });
    } catch {
      setError('password', {
        message: t('settings.delete_account_error'),
      });
    }
  };

  return (
    <ScreenContainer
      layoutMode="keyboard-aware"
      useSafeArea={false}
      background={
        <LinearGradient
          colors={colors.GRADIENT_HEADER}
          style={staticStyles.backgroundOverlay}
          testID="password-confirm-gradient"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      }
    >
      <View
        style={[
          styles.mainContainer,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.headerSection}>
          <AppIcon />
          <View style={styles.titleWrap}>
            <Text style={styles.title}>
              {t('settings.password_confirm_title')}
            </Text>
          </View>
          <View style={styles.subtitleWrap}>
            <Text style={styles.subtitle}>
              {t('settings.password_confirm_message')}
            </Text>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <PasswordInput
              name="password"
              control={control}
              placeholder={t('auth.password')}
              label={t('auth.password')}
              rules={{
                required: t('common.required'),
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />

            <View style={styles.submitWrap}>
              <ActionButton
                title={t('common.confirm')}
                onPress={() => void handleSubmit(onSubmit)()}
                loading={isLoading}
                testID="password-confirm-submit-button"
              />
            </View>

            <View style={styles.linkWrap}>
              <LinkButton
                title={t('settings.forgot_password')}
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
              />
            </View>

            <View style={styles.linkWrap}>
              <LinkButton
                title={t('common.cancel')}
                onPress={() => navigation.goBack()}
              />
            </View>
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const staticStyles = RNStyleSheet.create({
  backgroundOverlay: {
    ...RNStyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
});

const styles = StyleSheet.create((theme) => ({
  mainContainer: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  headerSection: {
    marginBottom: theme.spacing['2xl'],
    alignItems: 'center',
  },
  titleWrap: {
    marginTop: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  subtitleWrap: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
  },
  submitWrap: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  linkWrap: {
    marginTop: theme.spacing.md,
  },
}));
