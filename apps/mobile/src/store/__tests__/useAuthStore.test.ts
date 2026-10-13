import { useAuthStore } from '../useAuthStore';

jest.mock('src/utils/storage');
jest.mock('src/utils/encoding');
jest.mock('src/api/token', () => ({
  setClientTokenGetter: jest.fn(),
}));
jest.mock('src/api/client');

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      theme: 'system',
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('authenticate should set token, refreshToken, and update isAuthenticated', () => {
    const mockToken = 'header.payload.signature';
    const mockRefreshToken = 'refresh.header.payload';

    useAuthStore.getState().authenticate(mockToken, mockRefreshToken);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.refreshToken).toBe(mockRefreshToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('deauthenticate should clear state', () => {
    useAuthStore.setState({
      token: 'token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });

    useAuthStore.getState().deauthenticate();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
