/** Source file for PetProfileScreen. */
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppHeader } from 'src/component/common/AppHeader';
import { Card } from 'src/component/common/Card';
import { DetailsRow } from 'src/component/common/DetailsRow';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { PetProfileHeader } from 'src/component/pet/PetProfileHeader';
import { MessageCircle, Sparkles } from 'src/lib/icons';
import type { MainStackParamList } from 'src/types/navigation';

export function PetProfileScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'PetProfile'>>();
  const { pet } = route.params;

  const { t } = useTranslation();
  const photoUrls = pet.photos ?? [];

  return (
    <ScreenContainer header={<AppHeader showBack />}>
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PetProfileHeader
          name={pet.name}
          breedName={pet.breed_name}
          birthDate={pet.birth_date}
          gender={pet.gender ?? undefined}
          energyLevel={pet.energy_level ?? undefined}
          locationName={pet.location_name}
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
              <DetailsRow label={t('pet.breed')} value={pet.breed_name} />
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
            </Card>
          </View>

          <View style={styles.actionsContainer}>
            <ActionButton
              title={t('chat.message')}
              onPress={() => {}}
              icon={MessageCircle}
              testID="pet-profile-message-button"
            />
            <ActionButton
              title={t('discovery.super_like')}
              onPress={() => {}}
              icon={Sparkles}
              type="secondary"
              testID="pet-profile-superlike-button"
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
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
  actionsContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
}));
