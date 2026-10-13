/** Source file for useAuthApi. */
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyResetOtpRequest,
} from '@patty/contracts';
import { AuthService } from 'src/service/AuthService';

import { useApiMutation } from './useApiMutation';

/**
 * Hook for login mutation.
 */
export const useLogin = () => {
  return useApiMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (credentials: LoginRequest) => AuthService.login(credentials),
  });
};

/**
 * Hook for registration mutation.
 * Backend returns token directly on successful registration.
 */
export const useRegister = () => {
  return useApiMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: (credentials: RegisterRequest) =>
      AuthService.register(credentials),
  });
};

/**
 * Hook for forgot password mutation.
 */
export const useForgotPassword = () => {
  return useApiMutation<void, Error, ForgotPasswordRequest>({
    mutationFn: (payload: ForgotPasswordRequest) =>
      AuthService.forgotPassword(payload),
  });
};

/**
 * Hook for reset password mutation.
 */
export const useResetPassword = () => {
  return useApiMutation<void, Error, ResetPasswordRequest>({
    mutationFn: (payload: ResetPasswordRequest) =>
      AuthService.resetPassword(payload),
  });
};

/**
 * Hook for email verification mutation.
 */
export const useVerifyEmail = () => {
  return useApiMutation<void, Error, string>({
    mutationFn: (code: string) => AuthService.verifyEmail(code),
  });
};

/**
 * Hook for resending verification email mutation.
 */
export const useResendVerification = () => {
  return useApiMutation<void, Error, void>({
    mutationFn: () => AuthService.resendVerification(),
  });
};

/**
 * Hook for logout mutation. Invalidates the refresh token server-side.
 */
export const useLogout = () => {
  return useApiMutation<void, Error, void>({
    mutationFn: () => AuthService.logout(),
  });
};

/**
 * Hook for verifying a password reset OTP before navigating to the new password screen.
 */
export const useVerifyResetOtp = () => {
  return useApiMutation<void, Error, VerifyResetOtpRequest>({
    mutationFn: (payload: VerifyResetOtpRequest) =>
      AuthService.verifyResetOtp(payload),
  });
};

/**
 * Hook for account deletion mutation.
 */
export const useDeleteAccount = () => {
  return useApiMutation<void, Error, void>({
    mutationFn: () => AuthService.deleteAccount(),
  });
};

/**
 * Hook for password verification mutation.
 */
export const useVerifyPassword = () => {
  return useApiMutation<boolean, Error, string>({
    mutationFn: (password: string) => AuthService.verifyPassword(password),
  });
};
