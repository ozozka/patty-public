/** Step 2: Pet Details - Name, Gender, Birth Date */
import type { PetGender } from '@patty/contracts';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { DatePicker } from 'src/component/common/DatePicker';
import { TaggedInput } from 'src/component/common/TaggedInput';
import { Calendar } from 'src/lib/icons';
import { formatAge, formatDateForForm } from 'src/utils/date';

import { GenderSelector } from './GenderSelector';

interface PetStepDetailsProps {
  name: string;
  onNameChange: (name: string) => void;
  gender: PetGender | null;
  onGenderChange: (gender: PetGender) => void;
  birthDate: Date | null;
  onBirthDateChange: (date: Date) => void;
}

export function PetStepDetails({
  name,
  onNameChange,
  gender,
  onGenderChange,
  birthDate,
  onBirthDateChange,
}: PetStepDetailsProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateConfirm = (selectedDate: Date) => {
    onBirthDateChange(selectedDate);
    setShowDatePicker(false);
  };

  const formattedDate = formatDateForForm(
    birthDate,
    t('profile.select_birth_date'),
  );

  const age = birthDate ? formatAge(birthDate.toISOString()) : null;

  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>
          {t('pet.tell_us_about_pet', { name: name || t('pet.pet_name') })}
        </Text>
      </View>

      <View style={styles.content}>
        <TaggedInput
          testID="pet-form.name"
          label={t('profile.pet_name')}
          values={name}
          onChangeText={onNameChange}
          placeholder={t('profile.pet_name')}
          autoFocus
          autoCapitalize="words"
        />

        <GenderSelector
          gender={gender}
          setGender={onGenderChange}
          showPreferences={false}
        />

        <View>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{t('profile.birth_date')}</Text>
          </View>
          <TouchableOpacity
            testID="pet-details-birth-date"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Text
              style={[
                styles.dateText,
                birthDate ? styles.dateTextFilled : styles.dateTextPlaceholder,
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
            <View style={styles.ageWrap}>
              <Text style={styles.ageText}>{age}</Text>
            </View>
          )}
        </View>

        <DatePicker
          testID="pet-details-date-picker"
          visible={showDatePicker}
          value={birthDate}
          maxDate={new Date()}
          onClose={() => setShowDatePicker(false)}
          onConfirm={handleDateConfirm}
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE_ELEVATED,
    padding: theme.spacing.sm,
  },
  dateText: {
    ...theme.typography.body,
  },
  dateTextFilled: {
    color: theme.colors.TEXT,
  },
  dateTextPlaceholder: {
    color: theme.colors.TEXT_MUTED,
  },
  ageWrap: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  ageText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_SECONDARY,
  },
}));
