import type { PetCandidate } from '@patty/contracts';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { SwipeableStack } from '../SwipeableStack';

// Mock child components to keep the test focused on the stack
jest.mock('../DiscoveryPetCard', () => {
  const { View, Text } = require('react-native');
  return {
    DiscoveryPetCard: ({ pet }: any) => (
      <View testID="discovery-pet-card">
        <Text>{pet.name}</Text>
      </View>
    ),
  };
});

describe('SwipeableStack', () => {
  const mockCandidates = [
    {
      id: '1',
      name: 'Fluffy',
      species_id: 1,
      breed_id: 1,
      breed_name: 'Persian',
      gender: 'female' as const,
      birth_date: '2020-01-01',
      bio: '',
      photo_url: '',
      distance_m: 500,
      created_at: '2020-01-01',
      account_id: 'acc_1',
      photos: [],
    },
    {
      id: '2',
      name: 'Rex',
      species_id: 1,
      breed_id: 1,
      breed_name: 'Siamese',
      gender: 'male' as const,
      birth_date: '2021-01-01',
      bio: '',
      photo_url: '',
      distance_m: 600,
      created_at: '2020-01-01',
      account_id: 'acc_2',
      photos: [],
    },
  ];
  const mockCandidatesTyped = mockCandidates as PetCandidate[];

  it('renders nothing when empty', () => {
    const { queryByTestId } = renderWithProviders(
      <SwipeableStack
        candidates={[]}
        onSwipe={jest.fn()}
        onEmpty={jest.fn()}
      />,
    );
    expect(queryByTestId('discovery-pet-card')).toBeNull();
  });

  it('renders top candidate', () => {
    const { getByText } = renderWithProviders(
      <SwipeableStack
        candidates={mockCandidatesTyped}
        onSwipe={jest.fn()}
        onEmpty={jest.fn()}
      />,
    );
    // Fluffy is the top card, Rex is the next card.
    expect(getByText('Fluffy')).toBeTruthy();
    expect(getByText('Rex')).toBeTruthy();
  });

  it('exposes imperative swipe method', () => {
    const onSwipe = jest.fn();
    const ref = React.createRef<any>();

    renderWithProviders(
      <SwipeableStack
        ref={ref}
        candidates={mockCandidatesTyped}
        onSwipe={onSwipe}
        onEmpty={jest.fn()}
      />,
    );

    expect(typeof ref.current?.swipe).toBe('function');
  });
});
