import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { ActionButton } from '../ActionButton';

// Mock the haptics hook
jest.mock('src/hooks/ui/useHaptics', () => ({
  useHaptics: () => ({
    impactLight: jest.fn(),
  }),
}));

describe('ActionButton', () => {
  it('renders correctly with title', () => {
    const { getByText } = renderWithProviders(
      <ActionButton title="Save" onPress={jest.fn()} />,
    );
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <ActionButton title="Save" onPress={onPress} />,
    );
    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <ActionButton title="Save" onPress={onPress} disabled />,
    );
    fireEvent.press(getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <ActionButton
        title="Save"
        onPress={onPress}
        loading
        testID="action-btn"
      />,
    );
    fireEvent.press(getByTestId('action-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId, queryByText } = renderWithProviders(
      <ActionButton
        title="Save"
        onPress={jest.fn()}
        loading
        testID="action-btn"
      />,
    );
    expect(getByTestId('action-btn-loading')).toBeTruthy();
    expect(queryByText('Save')).toBeNull();
  });
});
