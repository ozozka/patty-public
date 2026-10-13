import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { ProfileCompletionModal } from '../ProfileCompletionModal';

describe('ProfileCompletionModal', () => {
  const steps = [
    {
      id: '1',
      label: 'Add a pet',
      isCompleted: false,
      action: 'pet' as const,
      weight: 1,
    },
    {
      id: '2',
      label: 'Upload a photo',
      isCompleted: true,
      action: 'photo' as const,
      weight: 1,
    },
  ];

  it('renders all steps', () => {
    const { getByText } = renderWithProviders(
      <ProfileCompletionModal
        isVisible={true}
        onClose={jest.fn()}
        steps={steps}
        onAction={jest.fn()}
      />,
    );
    expect(getByText('Add a pet')).toBeTruthy();
    expect(getByText('Upload a photo')).toBeTruthy();
  });

  it('calls onAction when an incomplete step is pressed', () => {
    const onAction = jest.fn();
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <ProfileCompletionModal
        isVisible={true}
        onClose={onClose}
        steps={steps}
        onAction={onAction}
      />,
    );

    fireEvent.press(getByText('Add a pet'));
    expect(onAction).toHaveBeenCalledWith('pet');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onAction when a completed step is pressed', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithProviders(
      <ProfileCompletionModal
        isVisible={true}
        onClose={jest.fn()}
        steps={steps}
        onAction={onAction}
      />,
    );

    fireEvent.press(getByText('Upload a photo'));
    expect(onAction).not.toHaveBeenCalled();
  });
});
