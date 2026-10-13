import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { DatePicker } from '../DatePicker';

// Mock Reanimated to run sync
jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('DatePicker', () => {
  it('does not render when visible is false', () => {
    const { queryByText } = renderWithProviders(
      <DatePicker
        visible={false}
        value={new Date(2023, 5, 15)}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    // Modal shouldn't be rendering content when closed completely
    expect(queryByText('datePicker.confirm')).toBeNull();
  });

  it('renders correctly when visible and calls onConfirm with date', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const initialDate = new Date(2023, 5, 15); // June 15, 2023

    const { getByText } = renderWithProviders(
      <DatePicker
        visible={true}
        value={initialDate}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Select Birth Date"
      />,
    );

    // Title should be present
    expect(getByText('Select Birth Date')).toBeTruthy();

    // Check if the confirm button works
    fireEvent.press(getByText('datePicker.confirm'));
    expect(onConfirm).toHaveBeenCalled();
    // It should be called with a Date matching the initial selection
    const confirmedArg = onConfirm.mock.calls[0]?.[0];
    expect(confirmedArg).toBeInstanceOf(Date);
    if (confirmedArg instanceof Date) {
      expect(confirmedArg.getFullYear()).toBe(2023);
      expect(confirmedArg.getMonth()).toBe(5);
      expect(confirmedArg.getDate()).toBe(15);
    }
  });

  it('calls onClose when cancel is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <DatePicker
        visible={true}
        value={new Date()}
        onClose={onClose}
        onConfirm={jest.fn()}
      />,
    );

    fireEvent.press(getByText('datePicker.cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
