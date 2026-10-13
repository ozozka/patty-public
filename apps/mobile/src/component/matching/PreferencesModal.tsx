/**
 * Modal component for editing pet discovery preferences.
 * Extracted from DiscoveryScreen for reusability.
 */
import type { PetGender } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { SearchableDropdown } from 'src/component/common/SearchableDropdown';
import { GenderSelector } from 'src/component/pet/GenderSelector';

export interface PetSelectorItem {
  id: string;
  name: string;
}

export interface PreferencesModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed (cancel or back button) */
  onClose: () => void;
  /** Callback when preferences are saved */
  onSave: () => void;
  /** Currently active pet for display in selector */
  activePet: { id: string; name: string } | null;
  /** List of available pets for the selector */
  petSelectorItems: PetSelectorItem[];
  /** Currently selected gender */
  gender: PetGender | null;
  /** Currently selected matching preferences */
  matchingPreferences: PetGender[] | null;
  /** Callback when matching preferences change */
  onPreferencesChange: (preferences: PetGender[]) => void;
  /** Callback when a different pet is selected */
  onPetSelect: (petId: string) => void;
  /** Search radius in km */
  radiusKm: number | null;
  /** Callback when radius changes */
  onRadiusChange: (radius: number | null) => void;
  /** Whether save operation is in progress */
  isSaving?: boolean;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

interface RadiusChipProps {
  radius: number | null;
  isSelected: boolean;
  onPress: () => void;
  testID: string;
}

function RadiusChip({ radius, isSelected, onPress, testID }: RadiusChipProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  return (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <View
        style={[
          styles.radiusChip,
          isSelected ? styles.radiusChipSelected : styles.radiusChipUnselected,
        ]}
      >
        <Text
          style={[
            styles.radiusChipText,
            {
              color: isSelected
                ? theme.colors.ON_PRIMARY
                : theme.colors.PRIMARY,
            },
          ]}
        >
          {radius === null
            ? t('profile.all')
            : `${radius}${t('discovery.km_suffix')}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Modal for editing discovery preferences including pet selection
 * and matching preferences.
 */
export function PreferencesModal({
  visible,
  onClose,
  onSave,
  activePet,
  petSelectorItems,
  gender,
  matchingPreferences,
  onPreferencesChange,
  onPetSelect,
  radiusKm,
  onRadiusChange,
  isSaving = false,
}: PreferencesModalProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  return (
    <ModalContainer
      visible={visible}
      onRequestClose={onClose}
      maxHeight="65%"
      title={t('discovery.preferences')}
    >
      <View style={styles.petSelectorWrap}>
        <SearchableDropdown
          data={petSelectorItems}
          onSelect={(item) => onPetSelect(item.id.toString())}
          selectedItem={activePet}
          placeholder={t('discovery.no_active_pet')}
        />
      </View>

      {gender && matchingPreferences && (
        <GenderSelector
          matchingPreferences={matchingPreferences}
          setMatchingPreferences={onPreferencesChange}
          showGender={false}
        />
      )}

      {/* Radius Filter */}
      <View style={styles.radiusSection}>
        <View style={styles.radiusLabel}>
          <Text style={styles.radiusLabelText}>
            {t('discovery.search_radius')}
          </Text>
        </View>
        <View style={styles.radiusChips}>
          {RADIUS_OPTIONS.map((radius) => (
            <RadiusChip
              key={radius ?? 'all'}
              testID={`preferences-modal-radius-${radius}`}
              radius={radius}
              isSelected={radiusKm === radius}
              onPress={() => onRadiusChange(radius)}
            />
          ))}
          <RadiusChip
            testID="preferences-modal-radius-all"
            radius={null}
            isSelected={radiusKm === null}
            onPress={() => onRadiusChange(null)}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          testID="preferences-modal-cancel-button"
          onPress={onClose}
        >
          <View style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.saveButtonWrap}>
          {isSaving ? (
            <ActivityIndicator color={theme.colors.PRIMARY} />
          ) : (
            <ActionButton
              testID="preferences-modal-save-button"
              title={t('common.save')}
              onPress={onSave}
            />
          )}
        </View>
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  petSelectorWrap: {
    marginBottom: theme.spacing.xl,
    zIndex: theme.zIndex.dropdown,
  },
  radiusSection: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  radiusLabel: {
    marginBottom: theme.spacing.sm,
  },
  radiusLabelText: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  radiusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  radiusChip: {
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.PRIMARY,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  radiusChipSelected: {
    backgroundColor: theme.colors.PRIMARY,
  },
  radiusChipUnselected: {
    backgroundColor: 'transparent',
  },
  radiusChipText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  footer: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.TEXT_SECONDARY,
  },
  saveButtonWrap: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
}));
