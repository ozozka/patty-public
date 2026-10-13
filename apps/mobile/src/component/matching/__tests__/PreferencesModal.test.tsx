import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { PreferencesModal } from '../PreferencesModal';

describe('PreferencesModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    activePet: { id: '1', name: 'Fluffy' },
    petSelectorItems: [{ id: '1', name: 'Fluffy' }],
    gender: 'male' as const,
    matchingPreferences: ['female' as const],
    onPreferencesChange: jest.fn(),
    onPetSelect: jest.fn(),
    radiusKm: 10,
    onRadiusChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = renderWithProviders(
      <PreferencesModal {...defaultProps} />,
    );
    expect(getByText('discovery.preferences')).toBeTruthy();
    expect(getByText('discovery.search_radius')).toBeTruthy();
  });

  it('calls onSave when save button is pressed', () => {
    const onSave = jest.fn();
    const { getByText } = renderWithProviders(
      <PreferencesModal {...defaultProps} onSave={onSave} />,
    );

    fireEvent.press(getByText('common.save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onRadiusChange when a radius chip is pressed', () => {
    const onRadiusChange = jest.fn();
    const { getByText } = renderWithProviders(
      <PreferencesModal {...defaultProps} onRadiusChange={onRadiusChange} />,
    );

    // Press the '25' radius chip
    // Note: The chip might render '25km' depending on the translation, but we look for the text containing '25'
    // Since translation mocked, it might return '25discovery.km_suffix'
    fireEvent.press(getByText('25discovery.km_suffix'));
    expect(onRadiusChange).toHaveBeenCalledWith(25);
  });
});
