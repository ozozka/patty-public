import { act, renderHook } from '@testing-library/react-native';

import { useLogin, useLogout } from '../../api/useAuthApi';
import { useAuthScenario } from '../useAuthScenario';

jest.mock('../../api/useAuthApi');

const mockLoginMutate = jest.fn();
const mockLogoutMutate = jest.fn();

describe('useAuthScenario', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useLogin).mockReturnValue({
      mutate: mockLoginMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogin>);

    jest.mocked(useLogout).mockReturnValue({
      mutate: mockLogoutMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it('performs login and updates store on success', () => {
    const { result } = renderHook(() => useAuthScenario());
    const credentials = { identifier: 'user', password: 'pwd' };

    act(() => {
      result.current.performLogin(credentials);
    });

    expect(mockLoginMutate).toHaveBeenCalledWith(
      credentials,
      expect.anything(),
    );

    const onSuccess = mockLoginMutate.mock.calls[0][1].onSuccess;
    onSuccess({
      token: 'new-token',
      refresh_token: 'new-refresh-token',
      status: 'verified',
    });
  });

  it('calls logout mutation', () => {
    const { result } = renderHook(() => useAuthScenario());

    act(() => {
      result.current.performLogout();
    });

    expect(mockLogoutMutate).toHaveBeenCalledWith(undefined, expect.anything());
  });
});
