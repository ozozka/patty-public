/** Scenario hook for pet discovery and swiping orchestration. */
import type {
  Pet,
  PetCandidate,
  PetGender,
  SwipeAction,
} from '@patty/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipe } from 'src/hooks/api/useMatchingApi';
import { useUpdatePet } from 'src/hooks/api/usePetApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import { useDiscoveryBuffer } from 'src/hooks/matching/useDiscoveryBuffer';
import { useMatchingStore } from 'src/store/useMatchingStore';
import { logger } from 'src/utils/logger';

export const useDiscoveryScenario = () => {
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();
  const { activePetId, setActivePetId, radiusKm, setRadiusKm } =
    useMatchingStore();

  // Pre-selection logic: if no pet is selected, select the first one
  useEffect(() => {
    const firstPetId = userProfile?.pets?.[0]?.id;
    if (!activePetId && firstPetId) {
      void setActivePetId(firstPetId.toString());
    }
  }, [activePetId, userProfile?.pets, setActivePetId]);

  const {
    buffer,
    isLoading: isBufferLoading,
    popCandidate,
    pushBack,
    clearBuffer,
  } = useDiscoveryBuffer(activePetId, radiusKm);

  const swipeMutation = useSwipe();
  const updatePetMutation = useUpdatePet();
  const [matchedPet, setMatchedPet] = useState<PetCandidate | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const handleSwipe = useCallback(
    (pet: PetCandidate, action: SwipeAction) => {
      if (!activePetId) return;

      // Optimistically remove from UI buffer
      popCandidate();

      swipeMutation.mutate(
        { activePetId, targetPetId: pet.id, action },
        {
          onSuccess: (data) => {
            if (data.is_match) {
              setMatchId(data.match_id);
              setMatchedPet(pet);
            }
          },
          onError: (error) => {
            logger.error('Swipe failed', { error });
            pushBack(pet);
          },
        },
      );
    },
    [activePetId, popCandidate, pushBack, swipeMutation],
  );

  const handleStackEmpty = useCallback(() => {
    void clearBuffer();
  }, [clearBuffer]);

  const petSelectorItems = useMemo(() => {
    return (
      userProfile?.pets.map((p: Pet) => ({ id: p.id, name: p.name })) ?? []
    );
  }, [userProfile]);

  const activePet = useMemo(() => {
    return userProfile?.pets.find((p: Pet) => p.id === activePetId) ?? null;
  }, [userProfile, activePetId]);

  const switchActivePet = useCallback(
    (petId: string) => {
      void setActivePetId(petId);
    },
    [setActivePetId],
  );

  const handleUpdateActivePet = useCallback(
    async (gender: PetGender, matchingPreferences: PetGender[]) => {
      if (!activePet) return;

      await updatePetMutation.mutateAsync(
        {
          id: activePet.id,
          data: {
            name: activePet.name,
            breed_id: activePet.breed_id,
            gender,
            matching_preferences: matchingPreferences,
            bio: activePet.bio,
            birth_date: activePet.birth_date,
            energy_level: activePet.energy_level,
          },
        },
        {
          onSuccess: () => {
            void clearBuffer(); // Clear and reload buffer with new preferences
          },
        },
      );
    },
    [activePet, updatePetMutation, clearBuffer],
  );

  return {
    buffer,
    isLoading: isProfileLoading || (isBufferLoading && activePetId !== null),
    activePet,
    petSelectorItems,
    matchedPet,
    setMatchedPet,
    matchId,
    setMatchId,
    handleSwipe,
    handleStackEmpty,
    switchActivePet,
    refetchCandidates: clearBuffer,
    updateActivePet: handleUpdateActivePet,
    isUpdatingPet: updatePetMutation.isPending,
    radiusKm,
    setRadiusKm,
  };
};
