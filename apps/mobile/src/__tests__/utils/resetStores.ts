/**
 * Isolated store reset helper with zero React Query dependency.
 * Required lazily in jest.setup.ts afterEach so that module mocks from
 * individual test files are already active when this runs.
 *
 * When a store is mocked by a test file, getState() / setState() won't exist
 * on the mock — we skip it intentionally (the mock owns its state).
 */
import { useAuthStore } from 'src/store/useAuthStore';
import { useChatStore } from 'src/store/useChatStore';
import { useMatchingStore } from 'src/store/useMatchingStore';
import { useUIStore } from 'src/store/useUIStore';

export function resetAllStores() {
  // Optional chaining handles auto-mocked stores (getState returns undefined)
  useAuthStore.getState?.()?.deauthenticate?.();
  useChatStore.getState?.()?.reset?.();
  useMatchingStore.setState?.({ activePetId: null });
  useUIStore.setState?.({
    alertVisible: false,
    alertOptions: null,
    toastVisible: false,
    toastMessage: '',
    toastType: 'info',
    reportOpen: false,
    reportTarget: null,
  });
}
