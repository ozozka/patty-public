import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from 'src/hooks/api/useUserApi';
import { useCloudinaryUpload } from 'src/hooks/feature/useCloudinaryUpload';
import { useImagePicker } from 'src/hooks/feature/useImagePicker';
import { useToast } from 'src/hooks/ui/useToast';
import { logger } from 'src/utils/logger';

/**
 * Scenario hook for updating the user's profile photo.
 * Orchestrates picking, uploading to Cloudinary, and updating the profile via API.
 */
export function useUpdateProfilePhotoScenario(userId?: string) {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const { pickImage, takePhoto } = useImagePicker();
  const { uploadImage, isUploading } = useCloudinaryUpload();
  const updateProfileMutation = useUpdateProfile();

  const handleUpdatePhoto = async (uri: string) => {
    if (!userId) {
      logger.error('Cannot update profile photo: userId is missing');
      return;
    }

    try {
      logger.info('Starting profile photo update flow', { uri, userId });

      // 1. Upload to Cloudinary
      const cloudinaryUrl = await uploadImage(uri, 'profile', userId);
      logger.info('Cloudinary upload successful', { cloudinaryUrl });

      // 2. Update profile via API
      await updateProfileMutation.mutateAsync({
        profile_picture_url: cloudinaryUrl,
      });

      success(
        `${t('profile.photo_updated_title')}: ${t('profile.photo_updated_message')}`,
      );

      logger.info('Profile photo update complete');
    } catch (error) {
      logger.error('Failed to update profile photo', { error });
      showError(
        `${t('error.common.title')}: ${t('error.profile.update_photo_failed')}`,
      );
    }
  };
  const onTakePhoto = async () => {
    const result = await takePhoto();
    if (!result.canceled && result.uri) {
      await handleUpdatePhoto(result.uri);
    }
  };

  const onChooseFromLibrary = async () => {
    const result = await pickImage();
    if (!result.canceled && result.uri) {
      await handleUpdatePhoto(result.uri);
    }
  };

  return {
    onTakePhoto,
    onChooseFromLibrary,
    isPending: isUploading || updateProfileMutation.isPending,
  };
}
