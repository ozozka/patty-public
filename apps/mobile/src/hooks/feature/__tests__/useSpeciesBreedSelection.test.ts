import type { Breed, SpeciesWithBreeds } from '@patty/contracts';
import { act, renderHook } from '@testing-library/react-native';

import { useSpeciesBreedSelection } from '../useSpeciesBreedSelection';

describe('useSpeciesBreedSelection hook', () => {
  const mockSpecies: SpeciesWithBreeds[] = [
    {
      id: 1,
      name_en: 'Dog',
      name_tr: 'Köpek',
      breeds: [
        { id: 101, species_id: 1, name_en: 'Retriever', name_tr: 'Retriever' },
      ],
    },
    {
      id: 2,
      name_en: 'Cat',
      name_tr: 'Kedi',
      breeds: [
        { id: 201, species_id: 2, name_en: 'Siamese', name_tr: 'Siyam' },
      ],
    },
  ];

  it('selects species and resets breed', () => {
    const { result } = renderHook(() => useSpeciesBreedSelection());

    const species0 = mockSpecies[0];
    if (species0) {
      act(() => {
        result.current.selectSpecies(species0);
      });
    }

    expect(result.current.selectedSpecies?.id).toBe(1);
    expect(result.current.breeds).toHaveLength(1);

    act(() => {
      const breed: Breed | undefined = mockSpecies[0]?.breeds[0];
      if (breed) {
        result.current.selectBreed(breed);
      }
    });
    expect(result.current.selectedBreed?.id).toBe(101);

    const species1 = mockSpecies[1];
    if (species1) {
      act(() => {
        result.current.selectSpecies(species1);
      });
    }
    expect(result.current.selectedSpecies?.id).toBe(2);
    expect(result.current.selectedBreed).toBeNull();
  });

  it('initializes from breed ID', () => {
    const { result } = renderHook(() =>
      useSpeciesBreedSelection({
        petMetadata: mockSpecies,
        initialBreedId: 201,
      }),
    );

    expect(result.current.selectedSpecies?.id).toBe(2);
    expect(result.current.selectedBreed?.id).toBe(201);
  });
});
