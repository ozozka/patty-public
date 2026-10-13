import type { Breed, PetGender, SpeciesWithBreeds } from '@patty/contracts';
import type { TFunction } from 'i18next';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { Card } from 'src/component/common/Card';
import { DatePicker } from 'src/component/common/DatePicker';
import { ImageCropModal } from 'src/component/common/ImageCropModal';
import { PhotoSelectionSheet } from 'src/component/common/PhotoSelectionSheet';
import { TaggedInput } from 'src/component/common/TaggedInput';
import type { FormPhoto } from 'src/hooks/scenario/usePetFormScenario';
import { Calendar } from 'src/lib/icons';
import { formatAge } from 'src/utils/date';

import { BreedSelector } from './BreedSelector';
import { GenderSelector } from './GenderSelector';
import { PetPhotoGrid } from './PetPhotoGrid';
import { SpeciesSelector } from './SpeciesSelector';

export interface PetFormData {
  name: string;
  birthDate: Date | null;
  gender: PetGender | null;
  photos: FormPhoto[];
  selectedSpecies: SpeciesWithBreeds | null;
  selectedBreed: Breed | null;
}

export interface PetFormProps {
  /** Form mode: 'add' for new pet, 'edit' for existing */
  mode: 'add' | 'edit';
  /** Form field values */
  values: PetFormData;
  /** Available species metadata */
  petMetadata: SpeciesWithBreeds[];
  /** Available breeds based on selected species */
  breeds: Breed[];
  /** Translation function */
  t: TFunction;
  /** Loading state */
  isLoading: boolean;
  /** Maximum number of photos allowed */
  maxPhotos: number;
  /** Callback when name changes */
  onNameChange: (name: string) => void;
  /** Callback when species is selected */
  onSpeciesSelect: (species: SpeciesWithBreeds) => void;
  /** Callback when breed is selected */
  onBreedSelect: (breed: Breed | null) => void;
  /** Callback when gender changes */
  onGenderChange: (gender: PetGender) => void;
  /** Callback when birth date changes */
  onBirthDateChange: (date: Date) => void;
  /** Callback to add photo from library */
  onAddFromLibrary: () => void;
  /** Callback to add photo from camera */
  onAddFromCamera: () => void;
  /** Callback to update a photo URI after cropping */
  onUpdatePhotoUri: (key: string, uri: string) => void;
  /** Callback to reorder photos */
  onReorderPhotos: (newPhotos: FormPhoto[]) => void;
  /** Callback to remove a photo by key */
  onRemovePhoto: (key: string) => void;
  /** Callback when form is submitted */
  onSubmit: () => void;
  /** Callback when delete is pressed (edit mode only) */
  onDelete?: () => void;
}

/**
 * Unified form component for pet creation and editing.
 */
export function PetForm({
  mode,
  values,
  petMetadata,
  breeds,
  t,
  isLoading,
  maxPhotos,
  onNameChange,
  onSpeciesSelect,
  onBreedSelect,
  onGenderChange,
  onBirthDateChange,
  onAddFromLibrary,
  onAddFromCamera,
  onUpdatePhotoUri,
  onReorderPhotos,
  onRemovePhoto,
  onSubmit,
  onDelete,
}: PetFormProps) {
  const { theme } = useUnistyles();
  const { name, birthDate, gender, photos, selectedSpecies, selectedBreed } =
    values;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [croppingKey, setCroppingKey] = useState<string | null>(null);

  const croppingPhoto = photos.find((p) => p.key === croppingKey);

  const photosSectionLabel = `${t('pet.photos')} (${photos.length}/${maxPhotos})`;

  const handleDateConfirm = (selectedDate: Date) => {
    onBirthDateChange(selectedDate);
    setShowDatePicker(false);
  };

  const handleCropConfirm = (croppedUri: string) => {
    if (croppingKey) {
      onUpdatePhotoUri(croppingKey, croppedUri);
      setCroppingKey(null);
    }
  };

  const formattedDate = birthDate
    ? birthDate.toLocaleDateString()
    : t('profile.select_birth_date');

  const age = birthDate ? formatAge(birthDate.toISOString()) : null;

  return (
    <View style={styles.container}>
      {/* Multi-photo grid */}
      <View style={styles.photoSection}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{photosSectionLabel}</Text>
        </View>
        <PetPhotoGrid
          photos={photos}
          onAddPhoto={() => setIsSheetVisible(true)}
          onRemovePhoto={onRemovePhoto}
          onCropPhoto={(key) => setCroppingKey(key)}
          onReorder={onReorderPhotos}
          isLoading={isLoading}
        />
      </View>

      <PhotoSelectionSheet
        isVisible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        onTakePhoto={onAddFromCamera}
        onChooseFromLibrary={onAddFromLibrary}
      />

      <ImageCropModal
        isVisible={!!croppingKey}
        uri={croppingPhoto?.uri ?? null}
        onCancel={() => setCroppingKey(null)}
        onConfirm={handleCropConfirm}
      />

      <View style={styles.formSection}>
        <Card variant="flat">
          <TaggedInput
            testID="pet-form.name"
            label={t('profile.pet_name')}
            values={name}
            onChangeText={onNameChange}
            placeholder={t('profile.pet_name')}
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <SpeciesSelector
                speciesList={petMetadata}
                onSelect={onSpeciesSelect}
                selectedSpeciesId={selectedSpecies?.id}
              />
            </View>
            {selectedSpecies && (
              <View style={styles.halfWidth}>
                <BreedSelector
                  breeds={breeds}
                  onSelect={onBreedSelect}
                  selectedBreedId={selectedBreed?.id}
                />
              </View>
            )}
          </View>
        </Card>
      </View>

      <View style={styles.formSection}>
        <Card variant="flat">
          <GenderSelector
            gender={gender}
            setGender={onGenderChange}
            showPreferences={false}
          />

          <View style={styles.dateLabelContainer}>
            <Text style={styles.label}>{t('profile.birth_date')}</Text>
          </View>
          <TouchableOpacity
            testID="pet-form-birth-date"
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              { borderColor: theme.colors.BORDER },
              { backgroundColor: theme.colors.SURFACE_ELEVATED },
            ]}
          >
            <Text
              style={[
                styles.dateText,
                {
                  color: birthDate
                    ? theme.colors.TEXT
                    : theme.colors.TEXT_MUTED,
                },
              ]}
            >
              {formattedDate}
            </Text>
            <Calendar
              size={theme.sizes.icon}
              color={theme.colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>
          {age && (
            <View style={styles.ageContainer}>
              <Text style={styles.ageText}>{age}</Text>
            </View>
          )}

          <DatePicker
            visible={showDatePicker}
            value={birthDate}
            maxDate={new Date()}
            onClose={() => setShowDatePicker(false)}
            onConfirm={handleDateConfirm}
          />
        </Card>
      </View>

      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.PRIMARY} />
        ) : (
          <>
            <View style={styles.buttonContainer}>
              <ActionButton
                testID="pet-form-save-button"
                title={t('common.save')}
                onPress={onSubmit}
              />
            </View>
            {mode === 'edit' && onDelete && (
              <View style={styles.buttonContainer}>
                <ActionButton
                  testID="pet-form-delete-button"
                  title={t('common.delete')}
                  onPress={onDelete}
                  type="danger"
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingVertical: theme.spacing.md,
  },
  photoSection: {
    marginBottom: theme.spacing.lg,
  },
  labelContainer: {
    marginBottom: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.TEXT_SECONDARY,
  },
  formSection: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  dateLabelContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    padding: theme.spacing.sm,
  },
  dateText: {
    ...theme.typography.body,
  },
  ageContainer: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  ageText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_SECONDARY,
  },
  footer: {
    marginTop: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
}));
