/**
 * Global alert dialog connected to useUIStore.
 * Renders a Dialog component based on store state.
 * Used in App.tsx for global alert functionality.
 */
import React from 'react';
import { Dialog } from 'src/component/common/Dialog';
import { useUIStore } from 'src/store/useUIStore';

export function AlertDialog() {
  const visible = useUIStore((s) => s.alertVisible);
  const options = useUIStore((s) => s.alertOptions);
  const hideAlert = useUIStore((s) => s.hideAlert);

  if (!options) return null;

  return (
    <Dialog
      testID="alert-dialog"
      visible={visible}
      onClose={hideAlert}
      title={options.title}
      message={options.message}
      buttons={options.buttons}
      closeOnBackdropPress={options.cancelable ?? true}
    />
  );
}
