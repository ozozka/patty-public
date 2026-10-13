/** Step 1: Species & Breed selection */
import type { Breed, SpeciesWithBreeds } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BreedSelector } from 'src/component/pet/BreedSelector';
import { SpeciesSelector } from 'src/component/pet/SpeciesSelector';

interface PetStepSpeciesProps {
  petMetadata: SpeciesWithBreeds[];
  selectedSpecies: SpeciesWithBreeds | null;
  selectedBreed: Breed | null;
  breeds: Breed[];
  onSpeciesSelect: (species: SpeciesWithBreeds) => void;
  onBreedSelect: (breed: Breed | null) => void;
  speciesModalVisible?: boolean;
  onSpeciesModalVisibleChange?: (visible: boolean) => void;
  breedModalVisible?: boolean;
  onBreedModalVisibleChange?: (visible: boolean) => void;
}

export function PetStepSpecies({
  petMetadata,
  selectedSpecies,
  selectedBreed,
  breeds,
  onSpeciesSelect,
  onBreedSelect,
  speciesModalVisible,
  onSpeciesModalVisibleChange,
  breedModalVisible,
  onBreedModalVisibleChange,
}: PetStepSpeciesProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.TEXT }]}>
          {t('pet.what_kind_of_pet')}
        </Text>
      </View>

      <View style={styles.selectorsContainer}>
        <SpeciesSelector
          speciesList={petMetadata}
          onSelect={onSpeciesSelect}
          selectedSpeciesId={selectedSpecies?.id}
          modalVisible={speciesModalVisible}
          onModalVisibleChange={onSpeciesModalVisibleChange}
        />

        {selectedSpecies && (
          <BreedSelector
            breeds={breeds}
            onSelect={onBreedSelect}
            selectedBreedId={selectedBreed?.id}
            modalVisible={breedModalVisible}
            onModalVisibleChange={onBreedModalVisibleChange}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
  },
  selectorsContainer: {
    gap: theme.spacing.md,
  },
}));
