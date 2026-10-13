import { fireEvent } from '@testing-library/react-native';
import type { TFunction } from 'i18next';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { PetForm } from '../PetForm';

// Mock components that are not the focus of this test to avoid complexity
jest.mock('src/component/common/DatePicker', () => ({
  DatePicker: () => null,
}));

describe('PetForm', () => {
  const defaultValues = {
    name: 'Fluffy',
    birthDate: null,
    gender: 'female' as const,
    photos: [],
    selectedSpecies: null,
    selectedBreed: null,
  };

  const defaultProps = {
    mode: 'add' as const,
    values: defaultValues,
    petMetadata: [],
    breeds: [],
    t: ((key: string) => key) as unknown as TFunction,
    isLoading: false,
    maxPhotos: 5,
    onNameChange: jest.fn(),
    onSpeciesSelect: jest.fn(),
    onBreedSelect: jest.fn(),
    onGenderChange: jest.fn(),
    onBirthDateChange: jest.fn(),
    onAddFromLibrary: jest.fn(),
    onAddFromCamera: jest.fn(),
    onUpdatePhotoUri: jest.fn(),
    onReorderPhotos: jest.fn(),
    onRemovePhoto: jest.fn(),
    onSubmit: jest.fn(),
    onDelete: jest.fn(),
  };

  it('renders correctly in add mode', () => {
    const { getByText, queryByText, getAllByText } = renderWithProviders(
      <PetForm {...defaultProps} />,
    );
    expect(getByText('common.save')).toBeTruthy();
    expect(queryByText('common.delete')).toBeNull();
  });

  it('renders delete button in edit mode', () => {
    const { getByText } = renderWithProviders(
      <PetForm {...defaultProps} mode="edit" />,
    );
    expect(getByText('common.delete')).toBeTruthy();
  });

  it('calls onSubmit when save button is pressed', () => {
    const onSubmit = jest.fn();
    const { getByText } = renderWithProviders(
      <PetForm {...defaultProps} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByText('common.save'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is pressed in edit mode', () => {
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(
      <PetForm {...defaultProps} mode="edit" onDelete={onDelete} />,
    );
    fireEvent.press(getByText('common.delete'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('shows activity indicator when loading', () => {
    const { queryByText } = renderWithProviders(
      <PetForm {...defaultProps} isLoading={true} />,
    );
    expect(queryByText('common.save')).toBeNull();
  });
});
