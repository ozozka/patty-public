import { act, renderHook } from '@testing-library/react-native';
import { LocationService } from 'src/service/LocationService';
import type { AuthState } from 'src/store/useAuthStore';
import { useAuthStore } from 'src/store/useAuthStore';

import { useRegister } from '../../api/useAuthApi';
import { useLocations } from '../../api/useLocationApi';
import { useRegisterScenario } from '../useRegisterScenario';

// Mocks
jest.mock('../../api/useAuthApi');
jest.mock('../../api/useLocationApi');
jest.mock('src/store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));
jest.mock('src/service/LocationService');

const mockAuthenticate = jest.fn();
const mockRegisterMutateAsync = jest.fn();
const mockLocations = [{ id: 1, name_tr: 'Istanbul', level: 'province' }];

describe('useRegisterScenario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRegister).mockReturnValue({
      mutate: mockRegisterMutateAsync,
      mutateAsync: mockRegisterMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useRegister>);
    jest
      .mocked(useLocations)
      .mockReturnValue({ data: mockLocations } as unknown as ReturnType<
        typeof useLocations
      >);
    jest
      .mocked(useAuthStore)
      .mockImplementation((selector) =>
        selector({ authenticate: mockAuthenticate } as unknown as AuthState),
      );
    jest.mocked(LocationService.getCurrentLocationData).mockResolvedValue(null);
  });

  it('performs registration and authenticates on success', async () => {
    mockRegisterMutateAsync.mockImplementation(
      (
        _data: unknown,
        options: {
          onSuccess: (response: {
            token: string;
            refresh_token: string;
          }) => void;
        },
      ) => {
        const response = {
          token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token',
          status: 'verified',
        };
        options.onSuccess(response);
      },
    );

    const { result } = renderHook(() => useRegisterScenario());

    await act(async () => {
      await (
        result.current.handleRegister as unknown as (
          data: Record<string, unknown>,
        ) => Promise<void>
      )({
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        home_location_id: 1,
      });
    });

    expect(mockRegisterMutateAsync).toHaveBeenCalled();

    // Get the options passed to mutate and manually trigger onSuccess
    const mutateOptions = mockRegisterMutateAsync.mock.calls[0][1];
    if (mutateOptions?.onSuccess) {
      await act(async () => {
        await mutateOptions.onSuccess({
          token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token',
          status: 'verified',
        });
      });
    }

    expect(mockAuthenticate).toHaveBeenCalledWith(
      'mock-jwt-token',
      'mock-refresh-token',
    );
  });
});
