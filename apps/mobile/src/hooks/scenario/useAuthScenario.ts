/** Scenario hook for authentication flows (Login). */
import type { LoginRequest } from '@patty/contracts';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLogin, useLogout } from 'src/hooks/api/useAuthApi';
import { useToast } from 'src/hooks/ui/useToast';
import { useAuthStore } from 'src/store/useAuthStore';
import { authRateLimiters } from 'src/utils/rateLimiter';

export const useAuthScenario = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const authenticate = useAuthStore((state) => state.authenticate);
  const deauthenticate = useAuthStore((state) => state.deauthenticate);

  const loginLimiter = useRef(authRateLimiters.login());

  const performLogin = (credentials: LoginRequest) => {
    if (!loginLimiter.current.canAttempt()) {
      toast.error(t('error.rate_limit.try_again_shortly'));
      return;
    }

    loginMutation.mutate(credentials, {
      onSuccess: (data) => {
        authenticate(data.token, data.refresh_token);
      },
      onError: (error) => {
        const message =
          error !== null &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : undefined;
        toast.error(message ?? t('error.auth.invalid_credentials'));
      },
    });
  };

  const performLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => deauthenticate(),
      onError: () => deauthenticate(), // always clear local state
    });
  };

  return {
    performLogin,
    performLogout,
    isLoggingIn: loginMutation.isPending,
  };
};
