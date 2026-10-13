/** Screen for entering new password during reset flow. */
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppIcon } from 'src/component/common/AppIcon';
import { Card } from 'src/component/common/Card';
import { LinkButton } from 'src/component/common/LinkButton';
import { PasswordInput } from 'src/component/common/PasswordInput';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useForgotPasswordScenario } from 'src/hooks/scenario/useForgotPasswordScenario';
import { useAuthStore } from 'src/store/useAuthStore';
import type {
  AuthStackParamList,
  MainStackParamList,
} from 'src/types/navigation';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

export function NewPasswordScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList & MainStackParamList>
    >();
  const route =
    useRoute<
      RouteProp<AuthStackParamList & MainStackParamList, 'NewPasswordScreen'>
    >();
  const { email, code } = route.params;
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.token);

  const { completePasswordReset, isResetting } = useForgotPasswordScenario();

  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: FormData) => {
    completePasswordReset({
      email,
      code,
      new_password: data.newPassword,
    });
  };

  return (
    <ScreenContainer
      layoutMode="keyboard-aware"
      useSafeArea={false}
      background={
        <LinearGradient
          colors={theme.colors.GRADIENT_HEADER}
          style={styles.backgroundOverlay}
          testID="new-password-gradient"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      }
    >
      <View
        style={[
          styles.mainContainer,
          {
            paddingTop: insets.top + theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl,
          },
        ]}
      >
        <View style={styles.headerContainer}>
          <AppIcon />
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{t('auth.reset_password_title')}</Text>
          </View>
          <View style={styles.descriptionWrap}>
            <Text style={styles.description}>
              {t('auth.reset_password_description')}
            </Text>
          </View>
          <View style={styles.emailWrap}>
            <Text style={styles.email}>{email}</Text>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <PasswordInput<FormData>
              name="newPassword"
              control={control}
              placeholder={t('auth.new_password')}
              label={t('auth.new_password')}
              rules={{
                required: t('common.required'),
                minLength: { value: 8, message: t('auth.password_too_short') },
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
            />

            <PasswordInput<FormData>
              name="confirmPassword"
              control={control}
              placeholder={t('settings.confirm_password')}
              label={t('settings.confirm_password')}
              rules={{
                required: t('common.required'),
                validate: (value: string) =>
                  value === watch('newPassword') ||
                  t('auth.passwords_do_not_match'),
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
            />

            <View style={styles.submitButtonWrap}>
              <ActionButton
                testID="new-password-save-button"
                title={t('auth.reset_password')}
                onPress={() => void handleSubmit(onSubmit)()}
                loading={isResetting}
              />
            </View>

            <View style={styles.cancelButtonWrap}>
              <LinkButton
                title={t('common.cancel')}
                onPress={() => {
                  if (token) {
                    navigation.navigate('ChangePassword');
                  } else {
                    navigation.navigate('LoginScreen');
                  }
                }}
              />
            </View>
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  mainContainer: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  headerContainer: {
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
  descriptionWrap: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  description: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  emailWrap: {
    marginTop: theme.spacing.xs,
  },
  email: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.PRIMARY,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
  },
  submitButtonWrap: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  cancelButtonWrap: {
    marginTop: theme.spacing.sm,
  },
}));
