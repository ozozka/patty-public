/**
 * Consolidated UI state store for transient, ephemeral UI concerns.
 * Manages alert dialogs, toast notifications, and report sheets.
 *
 * This store is intentionally separate from useAuthStore (persistent user
 * preferences) and useChatStore (domain state). Everything here resets
 * on app mount and has no persistence requirements.
 */
import { create } from 'zustand';

// ─── Alert ───────────────────────────────────────────────────────────

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
}

// ─── Toast ───────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

// ─── Report ──────────────────────────────────────────────────────────

export type ReportTargetType = 'account' | 'pet' | 'message';

export interface ReportTarget {
  type: ReportTargetType;
  accountId?: string;
  petId?: string;
  messageId?: string;
}

// ─── Combined State ──────────────────────────────────────────────────

export interface UIState {
  // Alert
  alertVisible: boolean;
  alertOptions: AlertOptions | null;
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;

  // Toast
  toastVisible: boolean;
  toastMessage: string;
  toastType: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;

  // Report
  reportOpen: boolean;
  reportTarget: ReportTarget | null;
  openReport: (target: ReportTarget) => void;
  closeReport: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // ─── Alert ───────────────────────────────────────────────────────
  alertVisible: false,
  alertOptions: null,

  showAlert: (options) => set({ alertVisible: true, alertOptions: options }),
  hideAlert: () => set({ alertVisible: false, alertOptions: null }),

  // ─── Toast ───────────────────────────────────────────────────────
  toastVisible: false,
  toastMessage: '',
  toastType: 'info',

  showToast: (message, type = 'info') =>
    set({ toastVisible: true, toastMessage: message, toastType: type }),
  hideToast: () => set({ toastVisible: false }),

  // ─── Report ──────────────────────────────────────────────────────
  reportOpen: false,
  reportTarget: null,

  openReport: (target) => set({ reportOpen: true, reportTarget: target }),
  closeReport: () => set({ reportOpen: false, reportTarget: null }),
}));
