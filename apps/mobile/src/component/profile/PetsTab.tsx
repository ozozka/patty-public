/** Source file for PetsTab. */
import type { Breed, Pet } from '@patty/contracts';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { Divider } from 'src/component/common/Divider';
import { EmptyState } from 'src/component/common/EmptyState';
import { PetCardSkeletonList } from 'src/component/common/Skeleton';
import { ProfilePetCard } from 'src/component/pet/ProfilePetCard';
import {
  useDeletedPets,
  usePetTypes,
  useRestorePet,
} from 'src/hooks/api/usePetApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import { useAlert } from 'src/hooks/ui/useAlert';
import { Heart, Plus } from 'src/lib/icons';
import { QueryKeys } from 'src/lib/queryKeys';
import type { MainStackParamList } from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export function PetsTab() {
  const queryClient = useQueryClient();
  const { theme } = useUnistyles();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
  } = useProfile();
  const {
    data: petMetadata,
    isLoading: isMetadataLoading,
    isFetching: isMetadataFetching,
  } = usePetTypes();
  const { data: deletedPets } = useDeletedPets();
  const restorePetMutation = useRestorePet();
  const alert = useAlert();
  const navigation = useNavigation<NavigationProp>();
  const { t, i18n } = useTranslation();

  const isLoading = isProfileLoading || isMetadataLoading;
  const isRefreshing = (isProfileFetching || isMetadataFetching) && !!profile;

  const handleRefresh = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: QueryKeys.profile() }),
      queryClient.invalidateQueries({ queryKey: QueryKeys.petTypes() }),
      queryClient.invalidateQueries({ queryKey: QueryKeys.deletedPets() }),
    ]);
  }, [queryClient]);

  const handleRestorePet = (pet: Pet) => {
    alert.show(
      t('settings.restore_account'),
      t('pet.restore_confirm', { name: pet.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: () => restorePetMutation.mutate(pet.id),
        },
      ],
    );
  };

  const getBreedName = (breedId: number) => {
    if (!petMetadata) return '';
    for (const species of petMetadata) {
      const breed = species.breeds.find((b: Breed) => b.id === breedId);
      if (breed) {
        return i18n.language === 'tr' ? breed.name_tr : breed.name_en;
      }
    }
    return '';
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.skeletonWrap}>
          <PetCardSkeletonList count={2} />
        </View>
      </View>
    );
  }

  const pets = profile?.pets ?? [];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: theme.spacing['4xl'] },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.PRIMARY}
          colors={[theme.colors.PRIMARY]}
        />
      }
    >
      {pets.length > 0 || (deletedPets && deletedPets.length > 0) ? (
        <>
          {pets.length > 0 && (
            <View style={styles.petsList}>
              {pets.map((item: Pet) => (
                <ProfilePetCard
                  key={item.id}
                  pet={item}
                  breedName={getBreedName(item.breed_id)}
                  onPress={(p) =>
                    navigation.navigate('MyPetProfile', { petId: p.id })
                  }
                />
              ))}
            </View>
          )}

          <View style={styles.addButtonWrap}>
            <ActionButton
              testID="pets-tab-add-pet-button"
              title={t('profile.add_pet')}
              onPress={() => navigation.navigate('AddPet')}
              icon={Plus}
            />
          </View>

          {deletedPets && deletedPets.length > 0 && (
            <View style={styles.deletedSection}>
              <Divider />
              <View style={styles.deletedHeader}>
                <Text style={styles.deletedTitle}>
                  {t('pet.recently_deleted')}
                </Text>
                <Text style={styles.deletedWarning}>
                  {t('settings.permanent_deletion_warning')}
                </Text>
              </View>

              {deletedPets.map((item: Pet) => (
                <ProfilePetCard
                  key={item.id}
                  pet={item}
                  breedName={getBreedName(item.breed_id)}
                  onPress={handleRestorePet}
                  isDeleted
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={Heart}
            title={t('profile.no_pets_yet')}
            subtitle={t('profile.add_your_first_pet')}
            onAction={() => navigation.navigate('AddPet')}
            actionTitle={t('profile.add_pet')}
            testID="pets-tab-empty-add-button"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  loadingContainer: {
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
  },
  skeletonWrap: {
    paddingTop: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing['2xl'],
    flexGrow: 1,
  },
  petsList: {
    paddingTop: theme.spacing.md,
  },
  addButtonWrap: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  deletedSection: {
    marginTop: theme.spacing['2xl'],
  },
  deletedHeader: {
    paddingVertical: theme.spacing.lg,
  },
  deletedTitle: {
    ...theme.typography.heading,
    color: theme.colors.TEXT_SECONDARY,
  },
  deletedWarning: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
