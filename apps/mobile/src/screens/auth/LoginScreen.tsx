/** Screen for user authentication (Login). */
import type { LoginRequest } from '@patty/contracts';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppIcon } from 'src/component/common/AppIcon';
import { Card } from 'src/component/common/Card';
import { ControlledInput } from 'src/component/common/ControlledInput';
import { LinkButton } from 'src/component/common/LinkButton';
import { PasswordInput } from 'src/component/common/PasswordInput';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useAuthScenario } from 'src/hooks/scenario/useAuthScenario';
import { useToast } from 'src/hooks/ui/useToast';
import type { AuthStackParamList } from 'src/types/navigation';

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'LoginScreen'>>();
  const { theme } = useUnistyles();
  const toast = useToast();

  const insets = useSafeAreaInsets();
  const { performLogin, isLoggingIn } = useAuthScenario();

  useEffect(() => {
    if (route.params?.errorMessage) {
      toast.error(route.params.errorMessage);
      navigation.setParams({ errorMessage: undefined });
    }
  }, [route.params, toast, navigation]);

  const { control, handleSubmit } = useForm<LoginRequest>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  return (
    <ScreenContainer
      testID="screen.login"
      layoutMode="keyboard-aware"
      useSafeArea={false}
      background={
        <LinearGradient
          colors={theme.colors.GRADIENT_HEADER}
          style={styles.backgroundOverlay}
          testID="login-gradient"
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
            <Text testID="login.welcome-title" style={styles.title}>
              {t('auth.welcome_title')}
            </Text>
          </View>
          <View style={styles.subtitleWrap}>
            <Text style={styles.subtitle}>{t('auth.welcome_subtitle')}</Text>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ControlledInput
              testID="login.identifier"
              name="identifier"
              control={control}
              placeholder={t('auth.identifier')}
              label={t('auth.identifier')}
              rules={{ required: t('common.required') }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
            />
            <PasswordInput
              testID="login.password"
              name="password"
              control={control}
              placeholder={t('auth.password')}
              label={t('auth.password')}
              rules={{ required: t('common.required') }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />

            <View style={styles.forgotPasswordWrap}>
              <LinkButton
                title={t('auth.forgot_password')}
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
              />
            </View>

            <View style={styles.submitButtonWrap}>
              <ActionButton
                testID="login-submit-button"
                title={t('auth.login')}
                onPress={() => void handleSubmit(performLogin)()}
                loading={isLoggingIn}
              />
            </View>

            <View style={styles.registerButtonWrap}>
              <LinkButton
                testID="login.register-button"
                title={t('auth.register')}
                onPress={() => navigation.navigate('RegisterScreen')}
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
  subtitleWrap: {
    marginTop: theme.spacing.xs,
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
  forgotPasswordWrap: {
    marginTop: 0,
    width: '100%',
    alignItems: 'flex-start',
  },
  submitButtonWrap: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  registerButtonWrap: {
    marginTop: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
  },
}));
