/** Scenario hook for forgot password flow. */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useForgotPassword,
  useResetPassword,
  useVerifyResetOtp,
} from 'src/hooks/api/useAuthApi';
import { useToast } from 'src/hooks/ui/useToast';
import { useAuthStore } from 'src/store/useAuthStore';
import type {
  AuthStackParamList,
  MainStackParamList,
} from 'src/types/navigation';
import { authRateLimiters } from 'src/utils/rateLimiter';

export const useForgotPasswordScenario = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList & MainStackParamList>
    >();
  const toast = useToast();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  const verifyOtpMutation = useVerifyResetOtp();
  const token = useAuthStore((state) => state.token);

  const { mutate: mutateForgotPassword } = forgotPasswordMutation;
  const { mutate: mutateVerifyOtp } = verifyOtpMutation;
  const { mutate: mutateResetPassword } = resetPasswordMutation;

  const [cooldown, setCooldown] = useState(0);
  const requestLimiter = useRef(authRateLimiters.forgotPassword());

  // Cooldown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
      if (timer.unref) timer.unref();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const requestResetCode = useCallback(
    (payload: { email: string }) => {
      if (!requestLimiter.current.canAttempt()) {
        toast.error(t('error.rate_limit.try_again_shortly'));
        return;
      }

      mutateForgotPassword(payload, {
        onSuccess: () => {
          setCooldown(60);
          toast.success(t('auth.reset_code_sent'));
          navigation.navigate('ResetPasswordOtpScreen', {
            email: payload.email,
          });
        },
      });
    },
    [mutateForgotPassword, navigation, toast, t],
  );

  const verifyResetCode = useCallback(
    (email: string, code: string) => {
      if (code.length !== 6) {
        toast.error(t('auth.invalid_code_length'));
        return;
      }
      mutateVerifyOtp(
        { email, code },
        {
          onSuccess: () => {
            navigation.navigate('NewPasswordScreen', { email, code });
          },
        },
      );
    },
    [mutateVerifyOtp, navigation, toast, t],
  );

  const completePasswordReset = useCallback(
    (payload: { email: string; code: string; new_password: string }) => {
      mutateResetPassword(payload, {
        onSuccess: () => {
          toast.success(t('auth.password_reset_success'));
          if (token) {
            navigation.navigate('ChangePassword');
          } else {
            navigation.navigate('LoginScreen');
          }
        },
      });
    },
    [mutateResetPassword, navigation, toast, t, token],
  );

  return {
    cooldown,
    requestResetCode,
    verifyResetCode,
    completePasswordReset,
    isRequesting: forgotPasswordMutation.isPending,
    isVerifying: verifyOtpMutation.isPending,
    isResetting: resetPasswordMutation.isPending,
  };
};
