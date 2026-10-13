import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { OtpInput } from '../OtpInput';

describe('OtpInput', () => {
  it('renders 6 input fields correctly', () => {
    const { getAllByPlaceholderText } = renderWithProviders(
      <OtpInput value="" onChange={jest.fn()} />,
    );
    expect(getAllByPlaceholderText('0')).toHaveLength(6);
  });

  it('calls onChange and advances focus when text is entered', () => {
    const onChange = jest.fn();
    const { getAllByPlaceholderText } = renderWithProviders(
      <OtpInput value="" onChange={onChange} />,
    );
    const inputs = getAllByPlaceholderText('0');

    fireEvent.changeText(inputs[0]!, '1');
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('backspace on empty input does not call onChange but might focus previous', () => {
    const onChange = jest.fn();
    const { getAllByPlaceholderText } = renderWithProviders(
      <OtpInput value="12" onChange={onChange} />,
    );
    const inputs = getAllByPlaceholderText('0');

    fireEvent(inputs[2]!, 'keyPress', { nativeEvent: { key: 'Backspace' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
