import { Alert } from 'react-native';

import {
  act,
  renderHookWithProviders,
} from '../../../__tests__/utils/test-utils';
import { useResendVerification, useVerifyEmail } from '../../api/useAuthApi';
import { useEmailVerificationScenario } from '../useEmailVerificationScenario';

jest.mock('../../api/useAuthApi');
jest.mock('react-native/Libraries/Alert/Alert');

const mockVerifyMutate = jest.fn();
const mockResendMutate = jest.fn();

describe('useEmailVerificationScenario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    jest.mocked(useVerifyEmail).mockReturnValue({
      mutate: mockVerifyMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useVerifyEmail>);
    jest.mocked(useResendVerification).mockReturnValue({
      mutate: mockResendMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useResendVerification>);
    jest.spyOn(Alert, 'alert').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates code and triggers verify automatically at 6 digits', () => {
    const { result } = renderHookWithProviders(() =>
      useEmailVerificationScenario(),
    );

    act(() => {
      result.current.setCode('123456');
    });

    expect(mockVerifyMutate).toHaveBeenCalledWith('123456', expect.anything());
  });

  it('handles verification success', () => {
    const { result } = renderHookWithProviders(() =>
      useEmailVerificationScenario(),
    );

    act(() => {
      result.current.setCode('123456');
    });

    expect(mockVerifyMutate).toHaveBeenCalled();
    const onSuccess = mockVerifyMutate.mock.calls[0][1].onSuccess;
    act(() => {
      onSuccess();
    });
  });

  it('handles resend with cooldown', () => {
    const { result } = renderHookWithProviders(() =>
      useEmailVerificationScenario(),
    );

    act(() => {
      result.current.handleResend();
    });

    expect(mockResendMutate).toHaveBeenCalled();

    const onSuccess = mockResendMutate.mock.calls[0][1].onSuccess;
    act(() => {
      onSuccess();
    });

    expect(result.current.cooldown).toBe(60);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.cooldown).toBe(59);
  });
});
