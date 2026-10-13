import type { PetGender } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Check, Mars, Venus } from 'src/lib/icons';

const GENDER_BUTTON_HEIGHT = 80;

const GENDER_STYLES = {
  male: {
    color: 'GENDER_MALE',
  },
  female: {
    color: 'GENDER_FEMALE',
  },
} as const;

interface GenderButtonProps {
  value: PetGender;
  label: string;
  icon: typeof Mars;
  selectedGender?: PetGender | null;
  onSelectGender?: (gender: PetGender) => void;
}

const GenderButton = React.memo(function GenderButton({
  value,
  label,
  icon: Icon,
  selectedGender,
  onSelectGender,
}: GenderButtonProps) {
  const { theme } = useUnistyles();
  const isSelected = selectedGender === value;
  const genderColor = theme.colors[GENDER_STYLES[value].color];

  return (
    <TouchableOpacity
      testID={`gender-selector-${value}`}
      activeOpacity={0.7}
      style={[
        styles.genderButton,
        isSelected
          ? { borderColor: genderColor }
          : { borderColor: theme.colors.BORDER },
      ]}
      onPress={() => onSelectGender && onSelectGender(value)}
    >
      <View style={styles.genderButtonContent}>
        <Icon
          size={theme.sizes.icon}
          color={isSelected ? genderColor : theme.colors.TEXT_MUTED}
        />
        <Text
          style={[
            styles.genderButtonText,
            { color: isSelected ? genderColor : theme.colors.TEXT_SECONDARY },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

interface PreferenceChipProps {
  value: PetGender;
  label: string;
  selectedPreferences?: PetGender[];
  onToggle?: (pref: PetGender) => void;
}

const PreferenceChip = React.memo(function PreferenceChip({
  value,
  label,
  selectedPreferences,
  onToggle,
}: PreferenceChipProps) {
  const { theme } = useUnistyles();
  const isSelected = selectedPreferences?.includes(value);
  const genderColor = theme.colors[GENDER_STYLES[value].color];

  return (
    <TouchableOpacity
      testID={`gender-preference-${value}`}
      activeOpacity={0.7}
      onPress={() => onToggle && onToggle(value)}
    >
      <View
        style={[
          styles.chip,
          isSelected
            ? {
                borderColor: genderColor,
                backgroundColor: genderColor + '0D',
              }
            : {
                borderColor: theme.colors.BORDER,
                backgroundColor: theme.colors.SURFACE,
              },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: isSelected ? genderColor : theme.colors.TEXT_SECONDARY },
          ]}
        >
          {label}
        </Text>
        {isSelected && (
          <View style={styles.checkWrap}>
            <Check size={theme.sizes.iconSm} color={genderColor} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

interface GenderSelectorProps {
  gender?: PetGender | null;
  setGender?: (gender: PetGender) => void;
  matchingPreferences?: PetGender[];
  setMatchingPreferences?: (prefs: PetGender[]) => void;
  showGender?: boolean;
  showPreferences?: boolean;
}

export function GenderSelector({
  gender,
  setGender,
  matchingPreferences,
  setMatchingPreferences,
  showGender = true,
  showPreferences = true,
}: GenderSelectorProps) {
  const { t } = useTranslation();

  const togglePreference = (pref: PetGender) => {
    if (matchingPreferences && setMatchingPreferences) {
      if (matchingPreferences.includes(pref)) {
        setMatchingPreferences(matchingPreferences.filter((p) => p !== pref));
      } else {
        setMatchingPreferences([...matchingPreferences, pref]);
      }
    }
  };

  return (
    <View style={styles.container}>
      {showGender && (
        <View style={styles.section}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{t('pet.gender')}</Text>
          </View>
          <View style={styles.buttonsRow}>
            <GenderButton
              value="male"
              label={t('profile.male')}
              icon={Mars}
              selectedGender={gender}
              onSelectGender={setGender}
            />
            <GenderButton
              value="female"
              label={t('profile.female')}
              icon={Venus}
              selectedGender={gender}
              onSelectGender={setGender}
            />
          </View>
        </View>
      )}

      {showPreferences && (
        <View style={styles.section}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{t('pet.show_me')}</Text>
          </View>
          <View style={styles.chipsRow}>
            <PreferenceChip
              value="male"
              label={t('profile.males')}
              selectedPreferences={matchingPreferences}
              onToggle={togglePreference}
            />
            <PreferenceChip
              value="female"
              label={t('profile.females')}
              selectedPreferences={matchingPreferences}
              onToggle={togglePreference}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  labelWrap: {
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  genderButton: {
    height: GENDER_BUTTON_HEIGHT,
    flex: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    backgroundColor: theme.colors.SURFACE,
  },
  genderButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  genderButtonText: {
    ...theme.typography.button,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  chipText: {
    ...theme.typography.button,
  },
  checkWrap: {
    marginLeft: theme.spacing.xs,
  },
}));
