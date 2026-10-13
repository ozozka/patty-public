/** Source file for SpeciesSelector. */
import type { SpeciesWithBreeds } from '@patty/contracts';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchableDropdown } from 'src/component/common/SearchableDropdown';

interface SpeciesSelectorProps {
  speciesList: SpeciesWithBreeds[];
  onSelect: (species: SpeciesWithBreeds) => void;
  selectedSpeciesId?: number;
  modalVisible?: boolean;
  onModalVisibleChange?: (visible: boolean) => void;
  testID?: string;
}

export function SpeciesSelector({
  speciesList = [],
  onSelect,
  selectedSpeciesId,
  modalVisible,
  onModalVisibleChange,
  testID = 'species-selector',
}: SpeciesSelectorProps) {
  const { t, i18n } = useTranslation();
  const isTurkish = i18n.language === 'tr';

  const dropdownData = useMemo(() => {
    return speciesList.map((s) => ({
      ...s,
      name: isTurkish ? s.name_tr : s.name_en,
    }));
  }, [speciesList, isTurkish]);

  const selectedItem = useMemo(() => {
    return dropdownData.find((s) => s.id === selectedSpeciesId);
  }, [dropdownData, selectedSpeciesId]);

  return (
    <SearchableDropdown
      label={t('pet.species')}
      data={dropdownData}
      onSelect={onSelect}
      selectedItem={selectedItem}
      placeholder={t('pet.select_species')}
      searchPlaceholder={t('pet.search_species')}
      modalVisible={modalVisible}
      onModalVisibleChange={onModalVisibleChange}
      testID={testID}
    />
  );
}
