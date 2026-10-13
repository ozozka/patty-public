import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useAuthStore } from 'src/store/useAuthStore';

import {
  act,
  fireEvent,
  renderScreen,
  waitFor,
} from '../../../__tests__/utils/test-utils';
import { LoginScreen } from '../LoginScreen';

// Unmock Api to use the real one with MSW
jest.unmock('src/api/client');

describe('LoginScreen', () => {
  it('performs login mutation and updates store on success', async () => {
    const { getByPlaceholderText, getByText } = renderScreen(() => (
      <ScreenContainer>
        <LoginScreen />
      </ScreenContainer>
    ));

    fireEvent.changeText(
      getByPlaceholderText('auth.identifier'),
      'test@example.com',
    );
    fireEvent.changeText(getByPlaceholderText('auth.password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('auth.login'));
    });

    // Wait for the store to be updated with the token from MSW handler
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.token).toBe('mock-jwt-token');
    });
  });
});
