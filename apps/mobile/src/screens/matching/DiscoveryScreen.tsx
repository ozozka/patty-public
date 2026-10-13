import type { PetCandidate, PetGender } from '@patty/contracts';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet as RNStyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { EmptyState } from 'src/component/common/EmptyState';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { MatchModal } from 'src/component/matching/MatchModal';
import { PreferencesModal } from 'src/component/matching/PreferencesModal';
import type { SwipeableStackRef } from 'src/component/matching/SwipeableStack';
import { SwipeableStack } from 'src/component/matching/SwipeableStack';
import { useBlockUserScenario } from 'src/hooks/scenario/useBlockUserScenario';
import { useDiscoveryScenario } from 'src/hooks/scenario/useDiscoveryScenario';
import { useAlert } from 'src/hooks/ui/useAlert';
import { useHaptics } from 'src/hooks/ui/useHaptics';
import { useToast } from 'src/hooks/ui/useToast';
import { Heart, MoreVertical, PawPrint, Star, X } from 'src/lib/icons';
import { useUIStore } from 'src/store/useUIStore';
import type { MainTabParamList } from 'src/types/navigation';

export function DiscoveryScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { impactLight, success } = useHaptics();
  const stackRef = useRef<SwipeableStackRef>(null);
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    buffer,
    isLoading,
    activePet,
    petSelectorItems,
    matchedPet,
    setMatchedPet,
    matchId,
    setMatchId,
    handleSwipe,
    handleStackEmpty,
    switchActivePet,
    refetchCandidates,
    updateActivePet,
    isUpdatingPet,
    radiusKm,
    setRadiusKm,
  } = useDiscoveryScenario();

  const alert = useAlert();
  const toast = useToast();
  const openReport = useUIStore((s) => s.openReport);
  const { handleBlock } = useBlockUserScenario();

  const [isPreferencesVisible, setIsPreferencesVisible] = useState(false);
  const [localGender, setLocalGender] = useState<PetGender | null>(null);
  const [localPrefs, setLocalPrefs] = useState<PetGender[] | null>(null);
  const [localRadius, setLocalRadius] = useState<number | null>(null);

  // Trigger success haptic on match
  useEffect(() => {
    if (matchedPet) {
      success();
    }
  }, [matchedPet, success]);

  const onSwipeAction = useCallback(
    (direction: 'LIKE' | 'DISLIKE') => {
      impactLight();
      stackRef.current?.swipe(direction);
    },
    [impactLight],
  );

  const openPreferences = useCallback(() => {
    if (activePet) {
      setLocalGender(activePet.gender ?? null);
      setLocalPrefs(activePet.matching_preferences);
      setLocalRadius(radiusKm);
      setIsPreferencesVisible(true);
    }
  }, [activePet, radiusKm]);

  const handleSavePreferences = useCallback(async () => {
    if (localGender && localPrefs) {
      await updateActivePet(localGender, localPrefs);
      void setRadiusKm(localRadius);
      setIsPreferencesVisible(false);
    }
  }, [localGender, localPrefs, localRadius, updateActivePet, setRadiusKm]);

  const handleCardLongPress = useCallback(
    (pet: PetCandidate) => {
      alert.show(t('profile.report'), '', [
        { text: t('common.cancel') },
        {
          text: t('profile.block'),
          onPress: () => {
            handleBlock({
              userId: pet.account_id,
              userName: pet.name,
              callbacks: {
                onSuccess: () => toast.success(t('profile.block_success')),
                onError: () => toast.error(t('error.generic.internal_error')),
              },
            });
          },
        },
        {
          text: t('profile.report'),
          onPress: () =>
            openReport({
              type: 'pet',
              petId: pet.id,
              accountId: pet.account_id,
            }),
        },
      ]);
    },
    [alert, toast, handleBlock, openReport, t],
  );

  // Show loading state when loading and no active pet selected yet
  if (isLoading && !activePet) {
    return <ScreenContainer testID="screen.discovery" loading center />;
  }

  if (!petSelectorItems.length) {
    return (
      <ScreenContainer testID="screen.discovery" center>
        <EmptyState
          icon={PawPrint}
          title={t('discovery.no_pets_title')}
          subtitle={t('discovery.no_pets_subtitle')}
          actionTitle={t('profile.add_pet')}
          onAction={() => navigation.navigate('PetsScreen')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="screen.discovery"
      header={
        <AppHeader
          title={t('navigation.discovery')}
          rightElement={
            <TouchableOpacity
              onPress={openPreferences}
              testID="discovery-filter-button"
            >
              <View style={styles.iconPadding}>
                <MoreVertical
                  size={theme.sizes.icon}
                  color={theme.colors.TEXT}
                />
              </View>
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.flex1} pointerEvents={matchedPet ? 'none' : 'auto'}>
        {activePet && isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.PRIMARY} />
          </View>
        ) : (
          <View style={styles.stackContainer}>
            <View style={RNStyleSheet.absoluteFill}>
              <EmptyState
                icon={PawPrint}
                title={t('discovery.no_more_pets')}
                subtitle={t('discovery.check_back_later')}
                onAction={() => void refetchCandidates()}
                onSecondaryAction={() => navigation.navigate('ChatListScreen')}
                secondaryActionTitle={t('discovery.view_matches')}
              />
            </View>
            {buffer.length > 0 && (
              <SwipeableStack
                ref={stackRef}
                testID="discovery-stack"
                candidates={buffer}
                onSwipe={handleSwipe}
                onEmpty={handleStackEmpty}
                onCardLongPress={handleCardLongPress}
              />
            )}
          </View>
        )}
      </View>

      {buffer.length > 0 && !isLoading && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            testID="discovery-pass-button"
            style={styles.passButton}
            onPress={() => onSwipeAction('DISLIKE')}
          >
            <X
              size={theme.sizes.iconLg}
              color={theme.colors.SWIPE_PASS}
              strokeWidth={3}
            />
          </TouchableOpacity>

          <TouchableOpacity
            testID="discovery-super-like-button"
            style={styles.superLikeButton}
            onPress={() => onSwipeAction('LIKE')}
          >
            <Star
              size={theme.sizes.icon}
              color={theme.colors.GENDER_OTHER}
              fill={theme.colors.GENDER_OTHER}
            />
          </TouchableOpacity>

          <TouchableOpacity
            testID="discovery-like-button"
            style={styles.likeButton}
            onPress={() => onSwipeAction('LIKE')}
          >
            <Heart
              size={theme.sizes.iconLg}
              color={theme.colors.SWIPE_LIKE}
              fill={theme.colors.SWIPE_LIKE}
            />
          </TouchableOpacity>
        </View>
      )}

      <MatchModal
        visible={!!matchedPet}
        onClose={() => {
          setMatchedPet(null);
          setMatchId(null);
        }}
        matchedPet={matchedPet}
        matchId={matchId}
        userPet={activePet}
      />

      <PreferencesModal
        visible={isPreferencesVisible}
        onClose={() => setIsPreferencesVisible(false)}
        onSave={() => void handleSavePreferences()}
        activePet={
          activePet ? { id: activePet.id, name: activePet.name } : null
        }
        petSelectorItems={petSelectorItems}
        gender={localGender}
        matchingPreferences={localPrefs}
        onPreferencesChange={setLocalPrefs}
        onPetSelect={(petId) => switchActivePet(petId)}
        radiusKm={localRadius}
        onRadiusChange={setLocalRadius}
        isSaving={isUpdatingPet}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  iconPadding: {
    padding: theme.spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackContainer: {
    marginTop: theme.spacing['2xl'],
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing.lg,
  },
  passButton: {
    width: theme.sizes.action,
    height: theme.sizes.action,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.SWIPE_PASS_SUBTLE,
    backgroundColor: theme.colors.BACKGROUND,
    ...theme.getShadow(1),
  },
  superLikeButton: {
    width: theme.sizes.actionSm,
    height: theme.sizes.actionSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.SUPER_LIKE_SUBTLE,
    backgroundColor: theme.colors.BACKGROUND,
    ...theme.getShadow(1),
  },
  likeButton: {
    width: theme.sizes.action,
    height: theme.sizes.action,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.SWIPE_LIKE_SUBTLE,
    backgroundColor: theme.colors.BACKGROUND,
    ...theme.getShadow(1),
  },
}));
