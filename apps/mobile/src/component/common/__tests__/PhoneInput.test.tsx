import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { PhoneInput } from '../PhoneInput';

describe('PhoneInput', () => {
  it('parses initial phone number correctly', () => {
    const { getAllByText, getByDisplayValue } = renderWithProviders(
      <PhoneInput
        phoneNumber="+441234567890"
        onChangePhoneNumber={jest.fn()}
      />,
    );
    expect(getAllByText('+44')[0]).toBeTruthy();
    expect(getByDisplayValue('1234567890')).toBeTruthy();
  });

  it('calls onChangePhoneNumber when local number changes', () => {
    const onChangePhoneNumber = jest.fn();
    const { getByDisplayValue } = renderWithProviders(
      <PhoneInput
        phoneNumber="+905554443322"
        onChangePhoneNumber={onChangePhoneNumber}
      />,
    );

    const input = getByDisplayValue('5554443322');
    fireEvent.changeText(input, '55544433221');

    expect(onChangePhoneNumber).toHaveBeenCalledWith('+9055544433221');
  });

  it('filters out non-numeric characters from local number', () => {
    const onChangePhoneNumber = jest.fn();
    const { getByDisplayValue } = renderWithProviders(
      <PhoneInput phoneNumber="+1" onChangePhoneNumber={onChangePhoneNumber} />,
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, '123abc456');

    expect(onChangePhoneNumber).toHaveBeenCalledWith('+1123456');
  });

  it('opens country modal and selects a country', async () => {
    const onChangePhoneNumber = jest.fn();
    const { getAllByText, getByText, queryByText } = renderWithProviders(
      <PhoneInput
        phoneNumber="+905554443322"
        onChangePhoneNumber={onChangePhoneNumber}
      />,
    );

    // Click the country code selector
    fireEvent.press(getAllByText('+90')[0]!);

    // The modal should appear with "USA" as an option
    await waitFor(() => {
      expect(getByText('USA')).toBeTruthy();
    });

    // Select USA
    fireEvent.press(getByText('USA'));

    // Should call onChangePhoneNumber with the new code + existing local number
    expect(onChangePhoneNumber).toHaveBeenCalledWith('+15554443322');
  });
});
