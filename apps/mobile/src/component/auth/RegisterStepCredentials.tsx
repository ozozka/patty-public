/** Step 2: Credentials - Email and Password inputs */
import type { RegisterRequest } from '@patty/contracts';
import React from 'react';
import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ControlledInput } from 'src/component/common/ControlledInput';
import { PasswordInput } from 'src/component/common/PasswordInput';

interface RegisterStepCredentialsProps {
  control: Control<RegisterRequest>;
}

export function RegisterStepCredentials({
  control,
}: RegisterStepCredentialsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>{t('auth.create_account')}</Text>
      </View>

      <View style={styles.descriptionWrap}>
        <Text style={styles.description}>{t('auth.why_email_needed')}</Text>
      </View>

      <View style={styles.inputsContainer}>
        <ControlledInput<RegisterRequest>
          testID="register.username"
          name="username"
          control={control}
          placeholder={t('auth.username')}
          label={t('auth.username')}
          rules={{ required: t('common.required') }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          width="100%"
          autoFocus
        />

        <ControlledInput<RegisterRequest>
          testID="register.email"
          name="email"
          control={control}
          placeholder={t('auth.email')}
          label={t('auth.email')}
          rules={{
            required: t('common.required'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t('auth.invalid_email'),
            },
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          width="100%"
        />

        <PasswordInput<RegisterRequest>
          testID="register.password"
          name="password"
          control={control}
          label={t('auth.password')}
          placeholder={t('auth.password')}
          rules={{
            required: t('common.required'),
            minLength: { value: 8, message: t('auth.password_too_short') },
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing.xl,
  },
  headerWrap: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  descriptionWrap: {
    marginBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  inputsContainer: {
    gap: theme.spacing.lg,
  },
}));
