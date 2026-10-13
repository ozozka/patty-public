import { renderHook } from '@testing-library/react-native';
import { useAlert } from 'src/hooks/ui/useAlert';
import { useTheme } from 'src/hooks/ui/useTheme';
import { useAuthStore } from 'src/store/useAuthStore';

import { useSettingsScenario } from '../useSettingsScenario';

const mockI18n = {
  language: 'en',
  changeLanguage: jest.fn(),
  t: (key: string) => key,
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

jest.mock('src/hooks/ui/useAlert');

jest.mock('src/hooks/api/useAuthApi', () => ({
  useLogout: () => ({ mutate: jest.fn(), isPending: false }),
}));

describe('useSettingsScenario', () => {
  const mockSetTheme = jest.fn();
  const mockSyncTheme = jest.fn();
  const mockShowAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState({
      token: null,
      isAuthenticated: false,
      isLoading: false,
      theme: 'system',
      language: 'tr',
    });
    mockI18n.language = 'en';

    jest.mocked(useTheme).mockReturnValue({
      theme: 'light',
      colors: { PRIMARY: '#F43F5E' },
      setTheme: mockSetTheme,
      syncTheme: mockSyncTheme,
    } as unknown as ReturnType<typeof useTheme>);

    jest.mocked(useAlert).mockReturnValue({
      show: mockShowAlert,
    } as unknown as ReturnType<typeof useAlert>);
  });

  describe('handleThemeChange', () => {
    it('calls setTheme with the new theme value', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleThemeChange('dark');

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('calls syncTheme with the new theme value', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleThemeChange('dark');

      expect(mockSyncTheme).toHaveBeenCalledWith('dark');
    });

    it('calls both setTheme and syncTheme with the same value', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleThemeChange('system');

      expect(mockSetTheme).toHaveBeenCalledWith('system');
      expect(mockSyncTheme).toHaveBeenCalledWith('system');
    });
  });

  describe('handleLogout', () => {
    it('shows confirmation alert with correct title key', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleLogout();

      expect(mockShowAlert).toHaveBeenCalledWith(
        'common.logout_confirm_title',
        expect.any(String),
        expect.any(Array),
      );
    });

    it('shows confirmation alert with correct message key', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleLogout();

      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.any(String),
        'common.logout_confirm_msg',
        expect.any(Array),
      );
    });

    it('shows alert with cancel button', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleLogout();

      const buttons = mockShowAlert.mock.calls[0][2];
      expect(buttons).toContainEqual(
        expect.objectContaining({
          text: 'common.cancel',
          style: 'cancel',
        }),
      );
    });

    it('shows alert with destructive logout button', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleLogout();

      const buttons = mockShowAlert.mock.calls[0][2];
      expect(buttons).toContainEqual(
        expect.objectContaining({
          text: 'auth.logout',
          style: 'destructive',
        }),
      );
    });
  });

  describe('handleDeleteAccount', () => {
    it('shows confirmation alert with correct title key', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleDeleteAccount();

      expect(mockShowAlert).toHaveBeenCalledWith(
        'settings.delete_account_confirm_title',
        expect.any(String),
        expect.any(Array),
      );
    });

    it('shows confirmation alert with correct message key', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleDeleteAccount();

      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.any(String),
        'settings.delete_account_confirm_msg',
        expect.any(Array),
      );
    });

    it('shows alert with cancel button', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleDeleteAccount();

      const buttons = mockShowAlert.mock.calls[0][2];
      expect(buttons).toContainEqual(
        expect.objectContaining({
          text: 'common.cancel',
          style: 'cancel',
        }),
      );
    });

    it('shows alert with destructive delete button', () => {
      const { result } = renderHook(() => useSettingsScenario());

      result.current.handleDeleteAccount();

      const buttons = mockShowAlert.mock.calls[0][2];
      expect(buttons).toContainEqual(
        expect.objectContaining({
          text: 'settings.delete_account',
          style: 'destructive',
        }),
      );
    });
  });

  describe('currentLanguageName', () => {
    it('returns Turkish name when i18n language is tr', () => {
      mockI18n.language = 'tr';

      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.currentLanguageName).toBe('Türkçe 🇹🇷');
    });

    it('returns English name when i18n language is en', () => {
      mockI18n.language = 'en';

      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.currentLanguageName).toBe('English 🇺🇸');
    });
  });

  describe('currentThemeName', () => {
    it('returns translated theme name based on current theme', () => {
      jest.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        colors: {},
        setTheme: mockSetTheme,
        syncTheme: mockSyncTheme,
      } as unknown as ReturnType<typeof useTheme>);

      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.currentThemeName).toBe('settings.theme_dark');
    });
  });

  describe('Return values', () => {
    it('returns theme from useTheme', () => {
      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.theme).toBe('light');
    });

    it('returns colors from useTheme', () => {
      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.colors).toEqual({ PRIMARY: '#F43F5E' });
    });

    it('returns navigation from useNavigation', () => {
      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.navigation).toBeDefined();
      expect(typeof result.current.navigation.navigate).toBe('function');
    });

    it('returns t function from useTranslation', () => {
      const { result } = renderHook(() => useSettingsScenario());

      expect(result.current.t).toBeDefined();
      expect(typeof result.current.t).toBe('function');
    });
  });
});
