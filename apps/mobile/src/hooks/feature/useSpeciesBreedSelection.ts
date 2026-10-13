import type { Breed, SpeciesWithBreeds } from '@patty/contracts';
import { useEffect, useMemo, useState } from 'react';

interface UseSpeciesBreedSelectionOptions {
  petMetadata?: SpeciesWithBreeds[] | null;
  initialBreedId?: number | null;
}

interface UseSpeciesBreedSelectionReturn {
  selectedSpecies: SpeciesWithBreeds | null;
  selectedBreed: Breed | null;
  breeds: Breed[];
  selectSpecies: (species: SpeciesWithBreeds) => void;
  selectBreed: (breed: Breed) => void;
}

export function useSpeciesBreedSelection(
  options: UseSpeciesBreedSelectionOptions = {},
): UseSpeciesBreedSelectionReturn {
  const { petMetadata, initialBreedId } = options;

  const [selectedSpecies, setSelectedSpecies] =
    useState<SpeciesWithBreeds | null>(null);
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);

  const breeds = useMemo(() => {
    return selectedSpecies ? selectedSpecies.breeds : [];
  }, [selectedSpecies]);

  useEffect(() => {
    if (petMetadata && initialBreedId && !selectedSpecies && !selectedBreed) {
      for (const species of petMetadata) {
        const breed = species.breeds.find(
          (b: Breed) => b.id === initialBreedId,
        );
        if (breed) {
          setSelectedSpecies(species);
          setSelectedBreed(breed);
          break;
        }
      }
    }
  }, [petMetadata, initialBreedId, selectedSpecies, selectedBreed]);

  const selectSpecies = (species: SpeciesWithBreeds) => {
    setSelectedSpecies(species);
    setSelectedBreed(null);
  };

  const selectBreed = (breed: Breed) => {
    setSelectedBreed(breed);
  };

  return {
    selectedSpecies,
    selectedBreed,
    breeds,
    selectSpecies,
    selectBreed,
  };
}
