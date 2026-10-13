/** Step 5: Discovery - Matching Preferences */
import type { PetGender } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { GenderSelector } from './GenderSelector';

interface PetStepDiscoveryProps {
  name: string;
  matchingPreferences: PetGender[];
  onMatchingPreferencesChange: (prefs: PetGender[]) => void;
}

export function PetStepDiscovery({
  name,
  matchingPreferences,
  onMatchingPreferencesChange,
}: PetStepDiscoveryProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.TEXT }]}>
          {t('pet.pet_preferences')}
        </Text>
      </View>

      <View style={styles.descriptionContainer}>
        <Text
          style={[styles.description, { color: theme.colors.TEXT_SECONDARY }]}
        >
          {t('pet.discovery_description', { name: name || t('pet.pet_name') })}
        </Text>
      </View>

      <View style={styles.selectorContainer}>
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
  descriptionContainer: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
  },
  selectorContainer: {
    gap: theme.spacing.md,
  },
}));
