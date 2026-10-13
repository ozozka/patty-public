/** Step 4: Preferences - Bio, Energy Level, and Matching Preferences */
import type { PetGender } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Zap } from 'src/lib/icons';

import { GenderSelector } from './GenderSelector';

const BIO_INPUT_HEIGHT = 100;

interface EnergyOption {
  value: number;
  label: string;
  icon: 'low' | 'medium' | 'high';
}

interface PetStepPreferencesProps {
  bio: string;
  onBioChange: (bio: string) => void;
  energyLevel: number | null;
  onEnergyLevelChange: (level: number | null) => void;
  matchingPreferences: PetGender[];
  onMatchingPreferencesChange: (prefs: PetGender[]) => void;
}

export function PetStepPreferences({
  bio,
  onBioChange,
  energyLevel,
  onEnergyLevelChange,
  matchingPreferences,
  onMatchingPreferencesChange,
}: PetStepPreferencesProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const energyOptions: EnergyOption[] = [
    { value: 1, label: t('pet.energy_low'), icon: 'low' },
    { value: 2, label: t('pet.energy_medium'), icon: 'medium' },
    { value: 3, label: t('pet.energy_high'), icon: 'high' },
  ];

  const getZapColor = (level: number) => {
    switch (level) {
      case 1:
        return theme.colors.SUCCESS;
      case 2:
        return theme.colors.SECONDARY;
      case 3:
        return theme.colors.ERROR;
      default:
        return theme.colors.TEXT_MUTED;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t('pet.pet_preferences')}</Text>
      </View>

      <View style={styles.content}>
        {/* Bio */}
        <View>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{t('profile.bio')}</Text>
          </View>
          <TextInput
            testID="pet-preferences-bio"
            style={styles.bioInput}
            value={bio}
            onChangeText={onBioChange}
            placeholder={t('pet.bio_placeholder')}
            placeholderTextColor={theme.colors.TEXT_MUTED}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={false}
          />
        </View>

        {/* Energy Level */}
        <View>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{t('pet.energy_level')}</Text>
          </View>
          <View style={styles.energyOptions}>
            {energyOptions.map((option) => (
              <TouchableOpacity
                testID={`pet-preferences-energy-${option.value}`}
                key={option.value}
                style={[
                  styles.energyOption,
                  {
                    borderColor:
                      energyLevel === option.value
                        ? theme.colors.PRIMARY
                        : theme.colors.BORDER,
                    backgroundColor:
                      energyLevel === option.value
                        ? theme.colors.PRIMARY + '26'
                        : theme.colors.SURFACE_ELEVATED,
                  },
                ]}
                onPress={() =>
                  onEnergyLevelChange(
                    energyLevel === option.value ? null : option.value,
                  )
                }
              >
                <View style={styles.energyOptionContent}>
                  <Zap
                    size={theme.sizes.icon}
                    color={getZapColor(option.value)}
                    fill={
                      energyLevel === option.value
                        ? getZapColor(option.value)
                        : 'transparent'
                    }
                  />
                  <Text
                    style={[
                      styles.energyLabel,
                      {
                        color:
                          energyLevel === option.value
                            ? theme.colors.PRIMARY
                            : theme.colors.TEXT_SECONDARY,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Matching Preferences */}
        <GenderSelector
          showGender={false}
          showPreferences={true}
          matchingPreferences={matchingPreferences}
          setMatchingPreferences={onMatchingPreferencesChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl + theme.spacing.md,
    paddingTop: theme.spacing.xl + theme.spacing.sm,
  },
  titleWrap: {
    marginBottom: theme.spacing.xl + theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  content: {
    gap: theme.spacing.md,
  },
  labelWrap: {
    marginBottom: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.TEXT_SECONDARY,
  },
  bioInput: {
    ...theme.typography.body,
    height: BIO_INPUT_HEIGHT,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE_ELEVATED,
    padding: theme.spacing.md,
    color: theme.colors.TEXT,
  },
  energyOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  energyOption: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    paddingVertical: theme.spacing.md,
  },
  energyOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  energyLabel: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
}));
