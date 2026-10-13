import type { ToastType } from 'src/store/useUIStore';
import { useUIStore } from 'src/store/useUIStore';

/**
 * Hook to trigger the global Toast system.
 */
export const useToast = () => {
  const showToast = useUIStore((state) => state.showToast);
  const hideToast = useUIStore((state) => state.hideToast);

  return {
    show: (message: string, type?: ToastType) => showToast(message, type),
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    info: (message: string) => showToast(message, 'info'),
    hide: hideToast,
  };
};
