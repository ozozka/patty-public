/** Screen for email verification after registration. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { OtpInput } from 'src/component/auth/OtpInput';
import { AppHeader } from 'src/component/common/AppHeader';
import { LinkButton } from 'src/component/common/LinkButton';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useEmailVerificationScenario } from 'src/hooks/scenario/useEmailVerificationScenario';

export function EmailVerificationScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const {
    code,
    setCode,
    cooldown,
    handleResend,
    handleLogout,
    isLoading,
    isError,
  } = useEmailVerificationScenario();

  return (
    <ScreenContainer
      testID="screen.email-verification"
      layoutMode="keyboard-aware"
      header={<AppHeader transparent />}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text testID="email-verification.title" style={styles.title}>
            {t('auth.verify_your_email')}
          </Text>
          <View style={styles.descriptionWrap}>
            <Text style={styles.description}>
              {t('auth.verification_code_sent_description')}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.otpWrap}>
            <OtpInput
              value={code}
              onChange={setCode}
              disabled={isLoading}
              error={isError}
              autoFocus
              testID="otp-input"
            />
          </View>

          {isLoading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.colors.PRIMARY} />
            </View>
          )}

          <View style={styles.resendContainer}>
            <View style={styles.resendTextWrap}>
              <Text style={styles.resendText}>
                {cooldown > 0
                  ? t('auth.resend_cooldown', { seconds: cooldown })
                  : t('auth.didnt_receive_code')}
              </Text>
            </View>
            <LinkButton
              title={t('auth.resend_code')}
              onPress={handleResend}
              disabled={cooldown > 0 || isLoading}
            />
          </View>
        </View>

        <View style={styles.logoutButtonWrap}>
          <LinkButton
            title={t('auth.logout_and_back')}
            onPress={() => void handleLogout()}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing.xl,
  },
  headerContainer: {
    marginBottom: theme.spacing['4xl'],
    alignItems: 'center',
  },
  title: {
    ...theme.typography.title,
    textAlign: 'center',
    color: theme.colors.PRIMARY,
  },
  descriptionWrap: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing['3xl'],
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  otpWrap: {
    marginTop: theme.spacing['4xl'],
    width: '100%',
  },
  loadingWrap: {
    marginVertical: theme.spacing.md,
  },
  resendContainer: {
    marginTop: theme.spacing['4xl'],
    alignItems: 'center',
  },
  resendTextWrap: {
    marginBottom: theme.spacing.xs,
  },
  resendText: {
    ...theme.typography.bodySmall,
    color: theme.colors.GRAY,
  },
  logoutButtonWrap: {
    marginTop: 'auto',
    marginBottom: theme.spacing['2xl'],
  },
}));
