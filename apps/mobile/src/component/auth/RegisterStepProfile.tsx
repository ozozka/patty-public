/** Step 4: Profile - Phone Number */
import type { RegisterRequest } from '@patty/contracts';
import React from 'react';
import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { PhoneInput } from 'src/component/common/PhoneInput';

interface RegisterStepProfileProps {
  control: Control<RegisterRequest>;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
}

export function RegisterStepProfile({
  phoneNumber,
  setPhoneNumber,
}: RegisterStepProfileProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>{t('auth.almost_there')}</Text>
      </View>

      <View style={styles.descriptionWrap}>
        <Text style={styles.description}>{t('auth.complete_profile')}</Text>
      </View>

      <View style={styles.inputsContainer}>
        <PhoneInput
          testID="register.phone"
          phoneNumber={phoneNumber}
          onChangePhoneNumber={setPhoneNumber}
          label={t('profile.phone')}
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
