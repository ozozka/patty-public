/** Source file for BreedSelector. */
import type { Breed } from '@patty/contracts';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { SearchableDropdown } from 'src/component/common/SearchableDropdown';

interface BreedSelectorProps {
  breeds: Breed[];
  onSelect: (breed: Breed) => void;
  selectedBreedId?: number;
  disabled?: boolean;
  modalVisible?: boolean;
  onModalVisibleChange?: (visible: boolean) => void;
  testID?: string;
}

export function BreedSelector({
  breeds = [],
  onSelect,
  selectedBreedId,
  disabled = false,
  modalVisible,
  onModalVisibleChange,
  testID = 'breed-selector',
}: BreedSelectorProps) {
  const { t, i18n } = useTranslation();
  const isTurkish = i18n.language === 'tr';

  const dropdownData = useMemo(() => {
    return breeds.map((b) => ({
      ...b,
      name: isTurkish ? b.name_tr : b.name_en,
    }));
  }, [breeds, isTurkish]);

  const selectedItem = useMemo(() => {
    return dropdownData.find((b) => b.id === selectedBreedId);
  }, [dropdownData, selectedBreedId]);

  return (
    <SearchableDropdown
      label={t('pet.breed')}
      data={dropdownData}
      onSelect={onSelect}
      selectedItem={selectedItem}
      placeholder={
        disabled ? t('pet.select_species_first') : t('pet.select_breed')
      }
      searchPlaceholder={t('pet.search_breed')}
      labelStyle={disabled ? styles.disabledLabel : undefined}
      modalVisible={modalVisible}
      onModalVisibleChange={onModalVisibleChange}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  disabledLabel: {
    opacity: 0.5,
  },
});
