/** Screen for initiating password reset by entering email. */
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
import { ControlledInput } from 'src/component/common/ControlledInput';
import { LinkButton } from 'src/component/common/LinkButton';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useForgotPasswordScenario } from 'src/hooks/scenario/useForgotPasswordScenario';
import type {
  AuthStackParamList,
  MainStackParamList,
} from 'src/types/navigation';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList & MainStackParamList>
    >();
  const { theme } = useUnistyles();

  const insets = useSafeAreaInsets();
  const { requestResetCode, isRequesting } = useForgotPasswordScenario();

  const { control, handleSubmit } = useForm<{ email: string }>({
    defaultValues: {
      email: '',
    },
  });

  return (
    <ScreenContainer
      layoutMode="keyboard-aware"
      useSafeArea={false}
      background={
        <LinearGradient
          colors={theme.colors.GRADIENT_HEADER}
          style={styles.backgroundOverlay}
          testID="forgot-password-gradient"
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
            <Text style={styles.title}>{t('auth.forgot_password_title')}</Text>
          </View>
          <View style={styles.descriptionWrap}>
            <Text style={styles.description}>
              {t('auth.forgot_password_description')}
            </Text>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ControlledInput
              name="email"
              control={control}
              placeholder={t('auth.email')}
              label={t('auth.email')}
              rules={{
                required: t('common.required'),
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: t('auth.invalid_email'),
                },
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <View style={styles.submitButtonWrap}>
              <ActionButton
                testID="forgot-password-submit-button"
                title={t('common.continue')}
                onPress={() => void handleSubmit(requestResetCode)()}
                loading={isRequesting}
              />
            </View>

            <View style={styles.backButtonWrap}>
              <LinkButton
                title={t('common.back')}
                onPress={() => navigation.goBack()}
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
  backButtonWrap: {
    marginTop: theme.spacing.sm,
  },
}));
