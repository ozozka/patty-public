import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { OtpInput } from 'src/component/auth/OtpInput';
import { AppHeader } from 'src/component/common/AppHeader';
import { LinkButton } from 'src/component/common/LinkButton';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useForgotPasswordScenario } from 'src/hooks/scenario/useForgotPasswordScenario';
import type {
  AuthStackParamList,
  MainStackParamList,
} from 'src/types/navigation';

export function ResetPasswordOtpScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList & MainStackParamList>
    >();
  const route =
    useRoute<
      RouteProp<
        AuthStackParamList & MainStackParamList,
        'ResetPasswordOtpScreen'
      >
    >();
  const { email: routeEmail } = route.params;
  const { theme } = useUnistyles();

  const {
    cooldown,
    verifyResetCode,
    requestResetCode,
    isRequesting,
    isVerifying,
  } = useForgotPasswordScenario();

  const [code, setCode] = useState('');
  const hasSubmittedRef = useRef(false);
  const isLoading = isRequesting || isVerifying;

  const handleVerify = useCallback(() => {
    if (code.length !== 6 || hasSubmittedRef.current || isLoading) return;
    hasSubmittedRef.current = true;
    verifyResetCode(routeEmail, code);
  }, [code, isLoading, verifyResetCode, routeEmail]);

  useEffect(() => {
    hasSubmittedRef.current = false;
  }, [code]);

  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      handleVerify();
    }
  }, [code, handleVerify, isLoading]);

  const handleResend = () => {
    requestResetCode({ email: routeEmail });
  };

  return (
    <ScreenContainer
      layoutMode="keyboard-aware"
      header={
        <AppHeader showBack onBack={() => navigation.goBack()} transparent />
      }
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('auth.verify_your_email')}</Text>
          <View style={styles.descriptionWrap}>
            <Text style={styles.description}>
              {t('auth.verification_code_sent_description')}
            </Text>
          </View>
          <View style={styles.emailWrap}>
            <Text style={styles.email}>{routeEmail}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.otpWrap}>
            <OtpInput
              value={code}
              onChange={setCode}
              disabled={isLoading}
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

        <View style={styles.backButtonWrap}>
          <LinkButton
            title={t('common.back')}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    flexGrow: 1,
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
  emailWrap: {
    marginTop: theme.spacing.md,
  },
  email: {
    ...theme.typography.bodySmall,
    fontWeight: 'bold',
    color: theme.colors.PRIMARY,
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
  backButtonWrap: {
    marginBottom: theme.spacing['2xl'],
    marginTop: 'auto',
  },
}));
