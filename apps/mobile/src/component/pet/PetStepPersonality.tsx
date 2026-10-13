/** Step 4: Personality - Bio and Energy Level */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Zap } from 'src/lib/icons';

const BIO_INPUT_HEIGHT = 120;

interface EnergyOption {
  value: number;
  label: string;
  icon: 'low' | 'medium' | 'high';
}

interface PetStepPersonalityProps {
  name: string;
  bio: string;
  onBioChange: (bio: string) => void;
  energyLevel: number | null;
  onEnergyLevelChange: (level: number | null) => void;
}

export function PetStepPersonality({
  name,
  bio,
  onBioChange,
  energyLevel,
  onEnergyLevelChange,
}: PetStepPersonalityProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

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
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('pet.tell_us_about_pet', { name: name || t('pet.pet_name') })}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Bio */}
        <View>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('profile.bio')}</Text>
          </View>
          <TextInput
            testID="pet-personality-bio"
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
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('pet.energy_level')}</Text>
          </View>
          <View style={styles.energyRow}>
            {energyOptions.map((option) => (
              <TouchableOpacity
                testID={`pet-energy-level-${option.value}`}
                key={option.value}
                activeOpacity={0.7}
                style={[
                  styles.energyOption,
                  { borderColor: theme.colors.BORDER },
                  energyLevel === option.value
                    ? {
                        backgroundColor: theme.colors.PRIMARY + '0D',
                        borderColor: theme.colors.PRIMARY,
                      }
                    : { backgroundColor: theme.colors.SURFACE },
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
    color: theme.colors.TEXT,
  },
  content: {
    gap: theme.spacing.lg,
  },
  labelContainer: {
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
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
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  energyOption: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    paddingVertical: theme.spacing.md,
  },
  energyOptionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  energyLabel: {
    ...theme.typography.button,
    fontWeight: '600',
  },
}));
