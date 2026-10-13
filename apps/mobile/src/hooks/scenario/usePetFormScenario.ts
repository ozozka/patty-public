/**
 * Unified pet form scenario hook for add and edit operations with step-by-step wizard.
 * Consolidates logic from useAddPetLogic and useEditPetLogic.
 */
import type {
  Breed,
  Pet,
  PetGender,
  SpeciesWithBreeds,
} from '@patty/contracts';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreatePet,
  useDeletePet,
  usePetTypes,
  useUpdatePet,
} from 'src/hooks/api/usePetApi';
import { useProfile } from 'src/hooks/api/useUserApi';
import type { FormPhoto } from 'src/hooks/feature/usePetPhotoManager';
import { usePetPhotoManager } from 'src/hooks/feature/usePetPhotoManager';
import { useStepWizard } from 'src/hooks/util/useStepWizard';
import { useUIStore } from 'src/store/useUIStore';
import type { MainStackParamList } from 'src/types/navigation';
import { uuidv4 } from 'src/utils/uuid';

// Re-export FormPhoto so callers don't need to import from two places
export type { FormPhoto };

/** Total number of steps in pet creation wizard */
const TOTAL_STEPS = 5;

export interface UsePetFormScenarioOptions {
  /** Form mode: 'add' for new pet, 'edit' for existing */
  mode: 'add' | 'edit';
}

export interface UsePetFormScenarioReturn {
  /** Translation function */
  t: TFunction;
  /** Pet data (edit mode only) */
  pet?: Pet;
  /** Form field values */
  name: string;
  setName: (name: string) => void;
  selectedSpecies: SpeciesWithBreeds | null;
  selectedBreed: Breed | null;
  setSelectedBreed: (breed: Breed | null) => void;
  birthDate: Date | null;
  setBirthDate: React.Dispatch<React.SetStateAction<Date | null>>;
  gender: PetGender | null;
  setGender: (gender: PetGender) => void;
  matchingPreferences: PetGender[];
  setMatchingPreferences: (preferences: PetGender[]) => void;
  bio: string;
  setBio: (bio: string) => void;
  energyLevel: number | null;
  setEnergyLevel: (level: number | null) => void;
  /** Current photo list */
  photos: FormPhoto[];
  /** Maximum photos allowed */
  maxPhotos: number;
  /** Minimum photos required */
  minPhotos: number;
  breeds: Breed[];
  petMetadata: SpeciesWithBreeds[];
  handleSpeciesSelect: (species: SpeciesWithBreeds) => void;
  /** Open the image library and append a photo */
  addPhotoFromLibrary: () => Promise<void>;
  /** Open the camera and append a photo */
  addPhotoFromCamera: () => Promise<void>;
  /** Remove a photo by its key */
  removePhoto: (key: string) => void;
  /** Reorder photos in the list */
  reorderPhotos: (newPhotos: FormPhoto[]) => void;
  /** Update photo URI after cropping */
  updatePhotoUri: (key: string, uri: string) => void;
  handleSave: () => Promise<void>;
  handleDelete?: () => void;
  isPending: boolean;
  /** Step wizard state */
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  goNext: () => void;
  goBack: () => void;
  canProceed: boolean;
}

type EditPetRouteProp = RouteProp<MainStackParamList, 'EditPet'>;

/**
 * Hook for managing pet form state and operations.
 * Consolidates add and edit logic into a single reusable hook.
 */
export function usePetFormScenario(
  options: UsePetFormScenarioOptions,
): UsePetFormScenarioReturn {
  const { mode } = options;
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // Step wizard
  const {
    currentStep,
    totalSteps,
    canGoBack,
    isFirstStep,
    isLastStep,
    goNext: goNextStep,
    goBack,
  } = useStepWizard({ totalSteps: TOTAL_STEPS });

  // API hooks
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const deletePetMutation = useDeletePet();
  const { data: petMetadata, isLoading: isMetadataLoading } = usePetTypes();
  const { data: profile } = useProfile();

  // Get petId from route in edit mode
  const route = useRoute<EditPetRouteProp>();
  const petId = mode === 'edit' ? String(route.params.petId) : undefined;

  // Find existing pet in edit mode
  const pet =
    mode === 'edit' && profile?.pets
      ? profile.pets.find((p: Pet) => p.id === petId)
      : undefined;

  // Photo management delegated to usePetPhotoManager
  const {
    photos,
    maxPhotos,
    minPhotos,
    isUploading,
    addPhotoFromLibrary,
    addPhotoFromCamera,
    removePhoto,
    reorderPhotos,
    updatePhotoUri,
    syncPhotosForAdd,
    syncPhotosForUpdate,
  } = usePetPhotoManager({ initialPhotos: pet?.photos });

  // Form state
  const [name, setName] = useState(pet?.name ?? '');
  const [selectedSpecies, setSelectedSpecies] =
    useState<SpeciesWithBreeds | null>(null);
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(
    pet?.birth_date ? new Date(pet.birth_date) : null,
  );
  const [gender, setGender] = useState<PetGender | null>(pet?.gender ?? null);
  const [matchingPreferences, setMatchingPreferences] = useState<PetGender[]>(
    pet?.matching_preferences ?? ['male', 'female'],
  );
  const [bio, setBio] = useState(pet?.bio ?? '');
  const [energyLevel, setEnergyLevel] = useState<number | null>(
    pet?.energy_level ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Derived state
  const breeds = useMemo(() => {
    return selectedSpecies ? selectedSpecies.breeds : [];
  }, [selectedSpecies]);

  // Initialize species and breed from pet data in edit mode
  useEffect(() => {
    if (
      mode === 'edit' &&
      petMetadata &&
      pet &&
      !selectedSpecies &&
      !selectedBreed
    ) {
      for (const species of petMetadata) {
        const breed = species.breeds.find((b: Breed) => b.id === pet.breed_id);
        if (breed) {
          setSelectedSpecies(species);
          setSelectedBreed(breed);
          break;
        }
      }
    }
  }, [mode, petMetadata, pet, selectedSpecies, selectedBreed]);

  // Handlers
  const handleSpeciesSelect = (species: SpeciesWithBreeds) => {
    setSelectedSpecies(species);
    setSelectedBreed(null);
  };

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return selectedSpecies !== null && selectedBreed !== null;
      case 1:
        return name.trim().length > 0 && gender !== null && birthDate !== null;
      case 2:
        return photos.length >= minPhotos;
      case 3:
        return true; // Bio and energy level are optional
      case 4:
        return matchingPreferences.length > 0;
      default:
        return false;
    }
  }, [
    currentStep,
    selectedSpecies,
    selectedBreed,
    name,
    gender,
    birthDate,
    photos.length,
    minPhotos,
    matchingPreferences.length,
  ]);

  const goNext = useCallback(() => {
    if (canProceed()) {
      goNextStep();
    }
  }, [canProceed, goNextStep]);

  const validateForm = (): boolean => {
    if (!selectedBreed) {
      return false;
    }

    if (!gender) {
      return false;
    }

    if (matchingPreferences.length === 0) {
      return false;
    }

    if (photos.length < minPhotos) {
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (mode === 'add') {
      await handleAdd();
    } else {
      await handleUpdate();
    }
  };

  const handleAdd = async () => {
    if (!selectedBreed || !gender) return;
    const petGender = gender;

    setIsSaving(true);
    try {
      const newPetId = uuidv4();

      await syncPhotosForAdd(newPetId);

      await createPetMutation.mutateAsync({
        id: newPetId,
        name,
        breed_id: selectedBreed.id,
        birth_date: birthDate?.toISOString().split('T')[0],
        gender: petGender,
        matching_preferences: matchingPreferences,
        bio,
        energy_level: energyLevel,
      });

      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!petId || !selectedBreed || !gender) return;
    const petGender = gender;

    setIsSaving(true);
    try {
      await syncPhotosForUpdate(petId, pet?.photos ?? []);

      await updatePetMutation.mutateAsync({
        id: petId,
        data: {
          id: petId,
          name,
          breed_id: selectedBreed.id,
          birth_date: birthDate?.toISOString().split('T')[0],
          gender: petGender,
          matching_preferences: matchingPreferences,
          bio,
          energy_level: energyLevel,
        },
      });

      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const showAlert = useUIStore((s) => s.showAlert);

  const handleDelete = () => {
    if (!petId) return;

    showAlert({
      title: t('pet.delete_title'),
      message: t('pet.delete_message', { name: pet?.name }),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deletePetMutation.mutateAsync(petId);
            navigation.navigate('MainTabs');
          },
        },
      ],
    });
  };

  // Calculate pending state
  const isPending =
    isMetadataLoading ||
    isUploading ||
    isSaving ||
    createPetMutation.isPending ||
    updatePetMutation.isPending ||
    deletePetMutation.isPending;

  return {
    t,
    pet,
    name,
    setName,
    selectedSpecies,
    selectedBreed,
    setSelectedBreed,
    birthDate,
    setBirthDate,
    gender,
    setGender,
    matchingPreferences,
    setMatchingPreferences,
    bio,
    setBio,
    energyLevel,
    setEnergyLevel,
    photos,
    maxPhotos,
    minPhotos,
    breeds,
    petMetadata: petMetadata ?? [],
    handleSpeciesSelect,
    addPhotoFromLibrary,
    addPhotoFromCamera,
    removePhoto,
    reorderPhotos,
    updatePhotoUri,
    handleSave,
    handleDelete: mode === 'edit' ? handleDelete : undefined,
    isPending,
    currentStep,
    totalSteps,
    canGoBack,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    canProceed: canProceed(),
  };
}
