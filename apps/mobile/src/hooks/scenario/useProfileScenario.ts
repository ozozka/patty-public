/** Scenario hook for profile and pet management orchestration. */
import type { PetRequest, UpdateUserRequest } from '@patty/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  useCreatePet,
  useDeletePet,
  usePetTypes,
  useUpdatePet,
} from 'src/hooks/api/usePetApi';
import { useProfile, useUpdateProfile } from 'src/hooks/api/useUserApi';
import { useCloudinaryUpload } from 'src/hooks/feature/useCloudinaryUpload';
import { PetService } from 'src/service/PetService';

export const useProfileScenario = () => {
  const [activeTab, setActiveTab] = useState('Info');
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: petMetadata, isLoading: isMetadataLoading } = usePetTypes();

  const updateProfileMutation = useUpdateProfile();
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const deletePetMutation = useDeletePet();
  const { uploadImage, isUploading } = useCloudinaryUpload();

  const refreshProfile = () => {
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const handleUpdateProfile = async (
    data: UpdateUserRequest,
    newImageUri?: string,
  ) => {
    let profile_picture_url = data.profile_picture_url;

    if (newImageUri && profile) {
      profile_picture_url = await uploadImage(
        newImageUri,
        'profile',
        profile.id,
      );
    }

    return updateProfileMutation.mutateAsync({
      ...data,
      profile_picture_url: profile_picture_url ?? undefined,
    });
  };

  const handleAddPet = async (petData: PetRequest, imageUri?: string) => {
    // Create pet first
    const result = await createPetMutation.mutateAsync(petData);

    // If there's an image, upload it and add as photo
    if (imageUri && result.id) {
      const imageUrl = await uploadImage(imageUri, 'pet', result.id);
      await PetService.addPhoto(result.id, imageUrl);
    }

    return result;
  };

  const handleDeletePet = async (petId: string) => {
    return deletePetMutation.mutateAsync(petId);
  };

  return {
    activeTab,
    setActiveTab,
    profile,
    petMetadata: petMetadata ?? [],
    isRefreshing: isProfileLoading || isMetadataLoading,
    isActionPending:
      updateProfileMutation.isPending ||
      createPetMutation.isPending ||
      updatePetMutation.isPending ||
      deletePetMutation.isPending ||
      isUploading,
    handleUpdateProfile,
    handleAddPet,
    handleDeletePet,
    refreshProfile,
  };
};
