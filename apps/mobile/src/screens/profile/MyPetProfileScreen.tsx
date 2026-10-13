/** Source file for MyPetProfileScreen. */
import type { Breed, Pet } from '@patty/contracts';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { Card } from 'src/component/common/Card';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { PetProfileHeader } from 'src/component/pet/PetProfileHeader';
import { usePetTypes } from 'src/hooks/api/usePetApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import { Pencil } from 'src/lib/icons';
import type { MainStackParamList } from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type ScreenRouteProp = RouteProp<MainStackParamList, 'MyPetProfile'>;

export function MyPetProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { petId } = route.params;

  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: speciesData } = usePetTypes();
  const { theme } = useUnistyles();

  const { t, i18n } = useTranslation();

  const pet = useMemo(() => {
    return profile?.pets?.find((p: Pet) => p.id === petId);
  }, [profile, petId]);

  const breedName = useMemo(() => {
    if (!pet?.breed_id || !speciesData) return null;
    for (const species of speciesData) {
      const breed = species.breeds.find((b: Breed) => b.id === pet.breed_id);
      if (breed) {
        return i18n.language === 'tr' ? breed.name_tr : breed.name_en;
      }
    }
    return null;
  }, [pet, speciesData, i18n.language]);

  const photoUrls = useMemo(() => {
    return pet?.photos?.map((p) => p.image_url) ?? [];
  }, [pet]);

  const getMatchingPreferences = () => {
    if (!pet?.matching_preferences || pet.matching_preferences.length === 0) {
      return null;
    }
    const prefs = pet.matching_preferences;
    if (prefs.length === 2) return t('profile.all');
    return prefs[0] === 'male' ? t('profile.male') : t('profile.female');
  };

  const matchingPreference = getMatchingPreferences();

  if (isProfileLoading) {
    return (
      <ScreenContainer header={<AppHeader showBack />}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.PRIMARY} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!pet) {
    return (
      <ScreenContainer header={<AppHeader showBack />}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>{t('pet.not_found')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const DetailsRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | undefined | null;
  }) => {
    if (!value) return null;
    return (
      <View style={styles.detailsRow}>
        <View style={styles.detailsLabel}>
          <Text style={styles.detailsLabelText}>{label}</Text>
        </View>
        <View style={styles.detailsValue}>
          <Text style={styles.detailsValueText}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer
      header={
        <AppHeader
          showBack
          rightElement={
            <TouchableOpacity
              onPress={() => navigation.navigate('EditPet', { petId })}
              testID="edit-pet-button"
            >
              <View style={styles.iconPadding}>
                <Pencil color={theme.colors.TEXT} size={theme.sizes.icon} />
              </View>
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PetProfileHeader
          name={pet.name}
          breedName={breedName ?? undefined}
          birthDate={pet.birth_date}
          gender={pet.gender ?? undefined}
          energyLevel={pet.energy_level ?? undefined}
          locationName={null}
          photos={photoUrls}
        />

        <View style={styles.contentContainer}>
          {pet.bio && (
            <View style={styles.sectionWrap}>
              <Card variant="flat">
                <View style={styles.sectionLabelWrap}>
                  <Text style={styles.sectionLabel}>{t('profile.about')}</Text>
                </View>
                <Text style={styles.bioText}>{pet.bio}</Text>
              </Card>
            </View>
          )}

          <View style={styles.sectionWrap}>
            <Card variant="flat">
              <View style={styles.sectionLabelWrap}>
                <Text style={styles.sectionLabel}>{t('profile.details')}</Text>
              </View>
              <DetailsRow label={t('pet.breed')} value={breedName} />
              <DetailsRow
                label={t('pet.gender')}
                value={
                  pet.gender
                    ? pet.gender === 'male'
                      ? t('profile.male')
                      : t('profile.female')
                    : undefined
                }
              />
              {pet.energy_level != null && (
                <DetailsRow
                  label={t('pet.energy_level')}
                  value={
                    pet.energy_level <= 2
                      ? t('pet.energy_low')
                      : pet.energy_level <= 4
                        ? t('pet.energy_medium')
                        : t('pet.energy_high')
                  }
                />
              )}
              {matchingPreference && (
                <DetailsRow
                  label={t('pet.preferred_gender')}
                  value={matchingPreference}
                />
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...theme.typography.body,
    color: theme.colors.TEXT_MUTED,
  },
  iconPadding: {
    padding: theme.spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing['4xl'],
  },
  contentContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing.xl,
  },
  sectionWrap: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabelWrap: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  bioText: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  detailsRow: {
    flexDirection: 'row',
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
    paddingVertical: theme.spacing.sm,
  },
  detailsLabel: {
    flex: 1,
  },
  detailsLabelText: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  detailsValue: {
    flex: 2,
  },
  detailsValueText: {
    ...theme.typography.body,
    textAlign: 'right',
    color: theme.colors.TEXT,
  },
}));
