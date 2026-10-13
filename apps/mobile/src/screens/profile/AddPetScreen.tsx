/** Source file for AddPetScreen with multi-step wizard. */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { StepWizard } from 'src/component/common/StepWizard';
import { PetStepDetails } from 'src/component/pet/PetStepDetails';
import { PetStepDiscovery } from 'src/component/pet/PetStepDiscovery';
import { PetStepPersonality } from 'src/component/pet/PetStepPersonality';
import { PetStepPhotos } from 'src/component/pet/PetStepPhotos';
import { PetStepSpecies } from 'src/component/pet/PetStepSpecies';
import { usePetFormScenario } from 'src/hooks/scenario/usePetFormScenario';

const styles = StyleSheet.create({
  wizardContainer: {
    width: '100%',
    flexGrow: 1,
  },
});

/**
 * Screen for adding a new pet with multi-step wizard.
 * Uses unified usePetFormScenario hook for form logic.
 */
export function AddPetScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [speciesModalVisible, setSpeciesModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false);

  const {
    name,
    setName,
    selectedSpecies,
    selectedBreed,
    setSelectedBreed,
    birthDate,
    setBirthDate,
    gender,
    setGender,
    bio,
    setBio,
    energyLevel,
    setEnergyLevel,
    matchingPreferences,
    setMatchingPreferences,
    photos,
    maxPhotos,
    minPhotos,
    breeds,
    petMetadata,
    handleSpeciesSelect,
    addPhotoFromLibrary,
    addPhotoFromCamera,
    removePhoto,
    reorderPhotos,
    updatePhotoUri,
    handleSave,
    isPending,
    currentStep,
    totalSteps,
    isLastStep,
    goNext,
    goBack,
    canProceed,
  } = usePetFormScenario({ mode: 'add' });

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PetStepSpecies
            petMetadata={petMetadata}
            selectedSpecies={selectedSpecies}
            selectedBreed={selectedBreed}
            breeds={breeds}
            onSpeciesSelect={handleSpeciesSelect}
            onBreedSelect={setSelectedBreed}
            speciesModalVisible={speciesModalVisible}
            onSpeciesModalVisibleChange={setSpeciesModalVisible}
            breedModalVisible={breedModalVisible}
            onBreedModalVisibleChange={setBreedModalVisible}
          />
        );
      case 1:
        return (
          <PetStepDetails
            name={name}
            onNameChange={setName}
            gender={gender}
            onGenderChange={setGender}
            birthDate={birthDate}
            onBirthDateChange={setBirthDate}
          />
        );
      case 2:
        return (
          <PetStepPhotos
            name={name}
            photos={photos}
            maxPhotos={maxPhotos}
            minPhotos={minPhotos}
            onAddFromLibrary={() => {
              void addPhotoFromLibrary();
            }}
            onAddFromCamera={() => {
              void addPhotoFromCamera();
            }}
            onRemovePhoto={removePhoto}
            onUpdatePhotoUri={updatePhotoUri}
            onReorderPhotos={reorderPhotos}
            isLoading={isPending}
          />
        );
      case 3:
        return (
          <PetStepPersonality
            name={name}
            bio={bio}
            onBioChange={setBio}
            energyLevel={energyLevel}
            onEnergyLevelChange={setEnergyLevel}
          />
        );
      case 4:
        return (
          <PetStepDiscovery
            name={name}
            matchingPreferences={matchingPreferences}
            onMatchingPreferencesChange={setMatchingPreferences}
          />
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScreenContainer
      scroll
      header={
        <AppHeader title={t('profile.add_pet')} showBack onBack={handleBack} />
      }
    >
      <View style={styles.wizardContainer}>
        <StepWizard
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={isLastStep ? () => void handleSave() : goNext}
          onBack={goBack}
          canProceed={canProceed}
          isLoading={isPending}
          nextButtonText={isLastStep ? t('common.save') : t('common.continue')}
        >
          {renderStep()}
        </StepWizard>
      </View>
    </ScreenContainer>
  );
}
