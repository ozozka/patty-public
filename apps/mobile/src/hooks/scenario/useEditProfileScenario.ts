/** Scenario hook for edit profile flow. */
import type { Location, ProfileResponse } from '@patty/contracts';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useVerifyEmail } from 'src/hooks/api/useAuthApi';
import { useLocations } from 'src/hooks/api/useLocationApi';
import { useProfile, useUpdateProfile } from 'src/hooks/api/useUserApi';
import { useCloudinaryUpload } from 'src/hooks/feature/useCloudinaryUpload';
import { useImagePicker } from 'src/hooks/feature/useImagePicker';
import { LocationService } from 'src/service/LocationService';
import { logger } from 'src/utils/logger';

export const useEditProfileScenario = () => {
  const { data: profile } = useProfile();
  const { data: locations } = useLocations();
  const updateProfileMutation = useUpdateProfile();
  const verifyEmailMutation = useVerifyEmail();
  const { uploadImage, isUploading } = useCloudinaryUpload();
  const navigation = useNavigation();

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { imageUri, pickImage } = useImagePicker({
    initialUri: profile?.profile_picture_url ?? null,
  });

  const { control, handleSubmit, setValue, watch, reset } =
    useForm<ProfileResponse>({
      defaultValues: {
        first_name: '',
        email: '',
        bio: '',
        phone_number: '',
        share_phone_with_matches: false,
        home_location_id: 0,
      },
      mode: 'onChange',
    });

  const formData = watch();
  const emailWatch = watch('email');
  const initialEmail = profile?.email ?? '';

  useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  const selectedLocation =
    locations?.find((l) => l.id === formData.home_location_id) ?? null;

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const locationData = await LocationService.getCurrentLocationData();
      if (locationData && locations) {
        const matched = LocationService.findMatchingLocation(
          locationData,
          locations ?? [],
        );
        if (matched) {
          setValue('home_location_id', matched.id);
        }
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleVerifyEmailCode = async (code: string) => {
    try {
      await verifyEmailMutation.mutateAsync(code);
    } catch (e) {
      logger.error('Email verification failed', { error: e });
      throw e;
    }
  };

  const handleSave = async (data: ProfileResponse) => {
    let profile_picture_url = imageUri;

    if (imageUri && imageUri.startsWith('file://') && profile) {
      try {
        profile_picture_url = await uploadImage(
          imageUri,
          'profile',
          profile.id,
        );
      } catch (e) {
        logger.error('Upload failed', { error: e });
        return;
      }
    }

    const emailChanged = data.email !== initialEmail;

    return new Promise<void>((resolve, reject) => {
      updateProfileMutation.mutate(
        {
          ...data,
          profile_picture_url: profile_picture_url ?? undefined,
        },
        {
          onSuccess: () => {
            if (!emailChanged) {
              navigation.goBack();
            }
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        },
      );
    });
  };

  return {
    control,
    handleSave: handleSubmit(handleSave),
    phoneNumber: formData.phone_number ?? '',
    setPhoneNumber: (val: string) => setValue('phone_number', val),
    sharePhoneWithMatches: formData.share_phone_with_matches ?? false,
    setSharePhoneWithMatches: (val: boolean) =>
      setValue('share_phone_with_matches', val),
    isPhoneVerified: profile?.phone_verified ?? false,
    selectedLocation,
    setSelectedLocation: (location: Location) =>
      setValue('home_location_id', location.id),
    imageUri,
    isDetectingLocation,
    locations: locations ?? [],
    pickImage,
    handleDetectLocation,
    handleVerifyEmailCode,
    emailWatch,
    initialEmail,
    isPending:
      updateProfileMutation.isPending ||
      isUploading ||
      verifyEmailMutation.isPending,
  };
};
