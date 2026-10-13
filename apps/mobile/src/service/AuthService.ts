/** Service for authentication-related API calls. */
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from '@patty/contracts';
import {
  loginResponseSchema,
  passwordVerifyResponseSchema,
  refreshTokenResponseSchema,
  registerResponseSchema,
} from '@patty/contracts';
import { apiClient } from 'src/api/client';

import { BaseService } from './BaseService';

export class AuthService extends BaseService {
  /**
   * Register a new user.
   * Backend returns token directly on successful registration.
   */
  static async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.api.v1.register.$post({
      json: data,
    });
    return this.handle(response, registerResponseSchema);
  }

  /**
   * Login a user.
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.api.v1.login.$post({
      json: credentials,
    });
    return this.handle(response, loginResponseSchema);
  }

  /**
   * Verify email with code.
   */
  static async verifyEmail(code: string): Promise<void> {
    const response = await apiClient.api.v1.auth['verify-email'].$post({
      json: { code },
    });
    return this.handle(response);
  }

  /**
   * Resend email verification code.
   */
  static async resendVerification(): Promise<void> {
    const response = await apiClient.api.v1.auth['resend-verification'].$post();
    return this.handle(response);
  }

  /**
   * Request password reset code.
   */
  static async forgotPassword(payload: { email: string }): Promise<void> {
    const response = await apiClient.api.v1.auth['forgot-password'].$post({
      json: { email: payload.email },
    });
    return this.handle(response);
  }

  /**
   * Reset password with code.
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await apiClient.api.v1.auth['reset-password'].$post({
      json: data,
    });
    return this.handle(response);
  }

  /**
   * Logout and invalidate the refresh token server-side.
   */
  static async logout(): Promise<void> {
    const response = await apiClient.api.v1.auth.logout.$post();
    return this.handle(response);
  }

  /**
   * Validate a password reset OTP without consuming it.
   */
  static async verifyResetOtp(payload: {
    email: string;
    code: string;
  }): Promise<void> {
    const response = await apiClient.api.v1.auth['verify-reset-otp'].$post({
      json: payload,
    });
    return this.handle(response);
  }

  /**
   * Restore a soft-deleted account.
   */
  static async restoreAccount(): Promise<void> {
    const response = await apiClient.api.v1.user.restore.$post();
    return this.handle(response);
  }

  /**
   * Verify password before sensitive actions.
   */
  static async verifyPassword(password: string): Promise<boolean> {
    const response = await apiClient.api.v1.user['verify-password'].$post({
      json: { password },
    });
    const result = await this.handle(response, passwordVerifyResponseSchema);
    return result.valid;
  }

  /**
   * Update push notification token.
   */
  static async registerPushToken(token: string | null): Promise<void> {
    const response = await apiClient.api.v1.account['push-token'].$put({
      json: { push_token: token },
    });
    return this.handle(response);
  }

  /**
   * Delete current account.
   */
  static async deleteAccount(): Promise<void> {
    const response = await apiClient.api.v1.user.$delete();
    return this.handle(response);
  }

  /**
   * Refresh the access token using a refresh token.
   */
  static async refreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    const response = await apiClient.api.v1.auth.refresh.$post({
      json: { refresh_token: refreshToken },
    });
    return this.handle(response, refreshTokenResponseSchema);
  }
}
