import { useNavigation } from '@react-navigation/native';
import { act } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { server } from 'src/__tests__/mocks/server';
import {
  createMockNavigation,
  renderHookWithProviders,
  waitFor,
} from 'src/__tests__/utils/test-utils';
import { Config } from 'src/Config';

import { useForgotPasswordScenario } from '../useForgotPasswordScenario';

jest.unmock('src/api/client');

const BASE_URL = Config.api.BASE_URL.replace(/\/$/, '');

describe('useForgotPasswordScenario', () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigation).mockReturnValue(
      createMockNavigation({
        navigate: mockNavigate,
        canGoBack: jest.fn().mockReturnValue(false),
        popToTop: jest.fn(),
        goBack: mockGoBack,
      }),
    );
  });

  it('requestResetCode calls mutation and navigates on success', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/forgot-password`, () => {
        return HttpResponse.json({ status: 'ok' });
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    await act(async () => {
      result.current.requestResetCode({ email: 'test@example.com' });
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('ResetPasswordOtpScreen', {
          email: 'test@example.com',
        });
      },
      { timeout: 2000 },
    );
  });

  it('verifyResetCode rejects invalid code length', async () => {
    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    await act(async () => {
      result.current.verifyResetCode('test@example.com', '12345');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('verifyResetCode navigates with email and code params on successful OTP validation', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/verify-reset-otp`, () => {
        return HttpResponse.json(null, { status: 200 });
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    await act(async () => {
      result.current.verifyResetCode('test@example.com', '123456');
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('NewPasswordScreen', {
          email: 'test@example.com',
          code: '123456',
        });
      },
      { timeout: 2000 },
    );
  });

  it('completePasswordReset calls mutation with params and navigates on success', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/reset-password`, () => {
        return HttpResponse.json({ status: 'ok' });
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    await act(async () => {
      result.current.completePasswordReset({
        email: 'test@example.com',
        code: '123456',
        new_password: 'newPassword123',
      });
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('LoginScreen');
      },
      { timeout: 2000 },
    );
  });

  it('isRequesting is false initially', async () => {
    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    expect(result.current.isRequesting).toBe(false);
  });

  it('isResetting is false initially', async () => {
    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    expect(result.current.isResetting).toBe(false);
  });

  it('isVerifying is false initially', async () => {
    const { result } = renderHookWithProviders(() =>
      useForgotPasswordScenario(),
    );

    expect(result.current.isVerifying).toBe(false);
  });
});
