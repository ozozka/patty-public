import { setClientTokenGetter } from 'src/api/token';
import { Storage as secureStorage } from 'src/utils/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;

  authenticate: (token: string, refreshToken: string) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  deauthenticate: () => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start true, bootstrap sets false
      theme: 'system',
      language: 'tr',

      authenticate: (token: string, refreshToken: string) => {
        set({ token, refreshToken, isAuthenticated: true, isLoading: false });
      },

      updateTokens: (token: string, refreshToken: string) => {
        set({ token, refreshToken });
      },

      deauthenticate: () => {
        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        theme: state.theme,
        language: state.language,
      }),
    },
  ),
);

// Register token getter for API client
setClientTokenGetter(() => useAuthStore.getState().token);
