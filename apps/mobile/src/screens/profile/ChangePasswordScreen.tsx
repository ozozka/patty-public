/** Source file for ChangePasswordScreen. */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppHeader } from 'src/component/common/AppHeader';
import { LinkButton } from 'src/component/common/LinkButton';
import { PasswordInput } from 'src/component/common/PasswordInput';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useChangePassword } from 'src/hooks/api/useUserApi';
import { useToast } from 'src/hooks/ui/useToast';
import type { MainStackParamList } from 'src/types/navigation';

export function ChangePasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const changePasswordMutation = useChangePassword();
  const { t } = useTranslation();
  const toast = useToast();
  const { theme } = useUnistyles();

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const handleSave = (data: (typeof control)['_formValues']) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error(t('auth.passwords_do_not_match'));
      return;
    }

    changePasswordMutation.mutate(
      {
        current_password: data.oldPassword,
        new_password: data.newPassword,
      },
      {
        onSuccess: () => {
          toast.success(t('settings.password_changed'));
          navigation.goBack();
        },
      },
    );
  };

  return (
    <ScreenContainer
      header={<AppHeader title={t('settings.change_password')} showBack />}
    >
      <View style={styles.container}>
        <PasswordInput
          name="oldPassword"
          control={control}
          label={t('settings.current_password')}
          placeholder={t('settings.current_password')}
          rules={{ required: t('common.required') }}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.forgotPasswordWrap}>
          <LinkButton
            title={t('auth.forgot_password')}
            onPress={() => {
              navigation.navigate('ForgotPasswordScreen');
            }}
          />
        </View>

        <PasswordInput
          name="newPassword"
          control={control}
          label={t('settings.new_password')}
          placeholder={t('settings.new_password')}
          rules={{
            required: t('common.required'),
            minLength: { value: 8, message: t('auth.password_too_short') },
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
        />
        <PasswordInput
          name="confirmPassword"
          control={control}
          label={t('settings.confirm_password')}
          placeholder={t('settings.confirm_password')}
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
        {changePasswordMutation.isPending ? (
          <ActivityIndicator color={theme.colors.PRIMARY} />
        ) : (
          <ActionButton
            title={t('common.save')}
            onPress={() => void handleSubmit(handleSave)()}
            testID="change-password-save-button"
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.md,
  },
  forgotPasswordWrap: {
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
}));
