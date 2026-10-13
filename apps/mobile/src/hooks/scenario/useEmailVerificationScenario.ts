/** Scenario hook for email verification flow. */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useResendVerification,
  useVerifyEmail,
} from 'src/hooks/api/useAuthApi';
import { QueryKeys } from 'src/lib/queryKeys';
import { useAuthStore } from 'src/store/useAuthStore';
import { useUIStore } from 'src/store/useUIStore';
import { authRateLimiters } from 'src/utils/rateLimiter';

export const useEmailVerificationScenario = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();
  const deauthenticate = useAuthStore((state) => state.deauthenticate);

  const resendLimiter = useRef(authRateLimiters.resendVerification());

  // Cooldown timer
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

  const handleVerify = useCallback(() => {
    if (code.length !== 6 || hasSubmitted || verifyMutation.isPending) {
      return;
    }

    setHasSubmitted(true);
    verifyMutation.mutate(code, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
      },
      onError: () => {
        setCode('');
        setHasSubmitted(false);
      },
    });
  }, [code, hasSubmitted, verifyMutation, queryClient]);

  // Auto-submit when code complete
  useEffect(() => {
    if (code.length === 6 && !hasSubmitted && !verifyMutation.isPending) {
      handleVerify();
    }
  }, [code, handleVerify, hasSubmitted, verifyMutation.isPending]);

  const handleResend = () => {
    if (cooldown > 0 || !resendLimiter.current.canAttempt()) {
      return;
    }

    resendMutation.mutate(undefined, {
      onSuccess: () => {
        setCooldown(60);
        useUIStore
          .getState()
          .showToast(t('auth.verification_email_sent'), 'success');
      },
    });
  };

  const handleLogout = () => {
    deauthenticate();
  };

  return {
    code,
    setCode,
    cooldown,
    handleVerify,
    handleResend,
    handleLogout,
    isLoading: verifyMutation.isPending || resendMutation.isPending,
    isError: verifyMutation.isError,
  };
};
