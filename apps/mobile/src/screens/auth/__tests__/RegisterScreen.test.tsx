import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from 'src/__tests__/mocks/server';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { Config } from 'src/Config';
import { useAuthStore } from 'src/store/useAuthStore';

import {
  act,
  fireEvent,
  renderWithProviders,
  waitFor,
} from '../../../__tests__/utils/test-utils';
import { RegisterScreen } from '../RegisterScreen';

// Unmock Api to use the real one with MSW
jest.unmock('src/api/client');

jest.mock('src/service/LocationService', () => ({
  LocationService: {
    getCurrentLocationData: jest.fn().mockResolvedValue(null),
    findMatchingLocation: jest.fn().mockReturnValue(null),
    normalize: jest.fn(),
    getLocations: jest.fn().mockResolvedValue([
      { id: 1, name_tr: 'Adana', level: 'province' },
      { id: 2, name_tr: 'Seyhan', level: 'district', parent_id: 1 },
      { id: 34, name_tr: 'İstanbul', level: 'province' },
    ]),
    resolveLocation: jest.fn(),
  },
}));

const BASE_URL = Config.api.BASE_URL.replace(/\/$/, '');

describe('RegisterScreen', () => {
  beforeEach(() => {
    // Reset Auth Store state
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Mock register endpoint to return LoginResponse
    server.use(
      http.post(`${BASE_URL}/register`, () => {
        return HttpResponse.json({
          token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token',
          status: 'verified',
        });
      }),
    );
  });

  it('renders multi-step registration wizard', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ScreenContainer>
        <RegisterScreen />
      </ScreenContainer>,
    );

    // Step 0: Name fields should be visible
    await waitFor(() => {
      expect(getByPlaceholderText('auth.first_name')).toBeTruthy();
      expect(getByPlaceholderText('auth.last_name')).toBeTruthy();
    });

    // Step 0 title should be visible
    expect(getByText('auth.whats_your_name')).toBeTruthy();
  });

  it('calls register mutation with correct data through all 4 steps', async () => {
    const { getByPlaceholderText, getByText, getAllByText, getByTestId } =
      renderWithProviders(
        <ScreenContainer>
          <RegisterScreen />
        </ScreenContainer>,
      );

    const nextButton = getByTestId('step-wizard-next-button');

    // Step 0: Fill name fields
    await waitFor(() => {
      expect(getByPlaceholderText('auth.first_name')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('auth.first_name'), 'John');
    fireEvent.changeText(getByPlaceholderText('auth.last_name'), 'Doe');

    // Continue to Step 1
    await act(async () => {
      fireEvent.press(nextButton);
    });

    // Step 1: Fill username, email and password
    await waitFor(() => {
      expect(getByPlaceholderText('auth.username')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('auth.username'), 'testuser');
    fireEvent.changeText(
      getByPlaceholderText('auth.email'),
      'test@example.com',
    );
    fireEvent.changeText(getByPlaceholderText('auth.password'), 'password123');

    // Continue to Step 2
    await act(async () => {
      fireEvent.press(nextButton);
    });

    // Step 2: Location selection
    await waitFor(() => {
      expect(getByText('profile.location')).toBeTruthy();
    });

    // Select Province (City)
    const provinceDropdown = getByTestId('province-dropdown');
    fireEvent.press(provinceDropdown);

    // Wait for modal and select Adana
    await waitFor(() => {
      expect(getAllByText('Adana').length).toBeGreaterThan(0);
    });
    fireEvent.press(getAllByText('Adana')[0]);

    // Select District
    await waitFor(() => {
      expect(getByTestId('district-dropdown')).toBeTruthy();
    });
    const districtDropdown = getByTestId('district-dropdown');
    fireEvent.press(districtDropdown);

    // Select Seyhan
    await waitFor(() => {
      expect(getAllByText('Seyhan').length).toBeGreaterThan(0);
    });
    fireEvent.press(getAllByText('Seyhan')[0]);

    // Continue to Step 3
    await act(async () => {
      fireEvent.press(nextButton);
    });

    // Step 3: Phone number (required to enable submit)
    await waitFor(() => {
      expect(getByText('profile.phone')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('register.phone-input'), '5554443322');

    // Complete registration
    await act(async () => {
      fireEvent.press(nextButton);
    });

    // Register success -> Auto-login -> updates store
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('mock-jwt-token');
    });
  });

  it('does not allow proceeding when mandatory fields are missing', async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <ScreenContainer>
        <RegisterScreen />
      </ScreenContainer>,
    );

    await waitFor(() => {
      expect(getByPlaceholderText('auth.first_name')).toBeTruthy();
    });

    const nextButton = getByTestId('step-wizard-next-button');

    // Attempt to continue with empty fields
    fireEvent.press(nextButton);

    // Should still be on Step 0
    expect(getByPlaceholderText('auth.first_name')).toBeTruthy();
  });
});
