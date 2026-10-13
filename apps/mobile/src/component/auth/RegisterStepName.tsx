/** Step 1: Name - First and Last name inputs */
import type { RegisterRequest } from '@patty/contracts';
import React from 'react';
import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ControlledInput } from 'src/component/common/ControlledInput';

interface RegisterStepNameProps {
  control: Control<RegisterRequest>;
}

export function RegisterStepName({ control }: RegisterStepNameProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>{t('auth.whats_your_name')}</Text>
      </View>

      <View style={styles.inputsContainer}>
        <ControlledInput<RegisterRequest>
          testID="register.first-name"
          name="first_name"
          control={control}
          placeholder={t('auth.first_name')}
          label={t('auth.first_name')}
          rules={{ required: t('common.required') }}
          autoCapitalize="words"
          autoCorrect={false}
          keyboardType="default"
          width="100%"
          autoFocus
        />

        <ControlledInput<RegisterRequest>
          testID="register.last-name"
          name="last_name"
          control={control}
          placeholder={t('auth.last_name')}
          label={t('auth.last_name')}
          rules={{ required: t('common.required') }}
          autoCapitalize="words"
          autoCorrect={false}
          keyboardType="default"
          width="100%"
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
    marginBottom: theme.spacing['2xl'],
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  inputsContainer: {
    gap: theme.spacing.lg,
  },
}));
