/**
 * Modal component for phone number verification.
 * Extracted from EditProfileScreen for reusability.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { TaggedInput } from 'src/component/common/TaggedInput';

export interface PhoneVerificationModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Phone number being verified */
  phoneNumber: string;
  /** Current verification code value */
  code: string;
  /** Callback when code changes */
  onCodeChange: (code: string) => void;
  /** Callback when verify button is pressed */
  onVerify: () => void;
  /** Callback when cancel is pressed */
  onCancel: () => void;
  /** Whether a verification request is in progress */
  isLoading?: boolean;
}

/**
 * Modal dialog for entering phone verification code.
 */
export function PhoneVerificationModal({
  visible,
  code,
  onCodeChange,
  onVerify,
  onCancel,
  isLoading = false,
}: PhoneVerificationModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <ModalContainer
      visible={visible}
      onRequestClose={onCancel}
      maxHeight="40%"
      closeOnBackdropPress={false}
      title={t('profile.enter_otp')}
    >
      <View style={styles.container}>
        <TaggedInput
          label={t('profile.otp')}
          values={code}
          onChangeText={onCodeChange}
          placeholder="123456"
          keyboardType="number-pad"
          width="100%"
        />
        <View style={styles.buttonContainer}>
          <ActionButton
            testID="phone-verification-verify-button"
            title={t('common.verify')}
            onPress={onVerify}
            loading={isLoading}
          />
        </View>
        <TouchableOpacity
          testID="phone-verification-cancel-button"
          onPress={onCancel}
        >
          <View style={styles.cancelContainer}>
            <Text
              style={[
                styles.cancelText,
                { color: theme.colors.TEXT_SECONDARY },
              ]}
            >
              {t('common.cancel')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingBottom: theme.spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  cancelContainer: {
    marginTop: theme.spacing.md,
  },
  cancelText: {
    ...theme.typography.body,
  },
}));
