import { useCallback } from 'react';
import type { AlertButton, AlertOptions } from 'src/store/useUIStore';
import { useUIStore } from 'src/store/useUIStore';

/**
 * Hook to trigger the global custom Alert system.
 */
export const useAlert = () => {
  const showAlertStore = useUIStore((state) => state.showAlert);
  const hideAlertStore = useUIStore((state) => state.hideAlert);

  const show = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: { cancelable?: boolean },
    ) => {
      showAlertStore({
        title,
        message,
        buttons,
        cancelable: options?.cancelable ?? true,
      });
    },
    [showAlertStore],
  );

  const alert = useCallback(
    (options: AlertOptions) => {
      showAlertStore(options);
    },
    [showAlertStore],
  );

  return {
    show,
    alert,
    hide: hideAlertStore,
  };
};
