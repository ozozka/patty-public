import { act, renderHook } from '@testing-library/react-native';
import { LocationService } from 'src/service/LocationService';

import { useVerifyEmail } from '../../api/useAuthApi';
import { useLocations } from '../../api/useLocationApi';
import { useProfile, useUpdateProfile } from '../../api/useUserApi';
import { useCloudinaryUpload } from '../../feature/useCloudinaryUpload';
import { useImagePicker } from '../../feature/useImagePicker';
import { useEditProfileScenario } from '../useEditProfileScenario';

// Mocks
jest.mock('../../api/useUserApi');
jest.mock('../../api/useLocationApi');
jest.mock('../../api/useAuthApi');
jest.mock('../../feature/useCloudinaryUpload');
jest.mock('../../feature/useImagePicker');
jest.mock('src/service/LocationService');

describe('useEditProfileScenario', () => {
  const mockProfile = {
    id: 'user-1',
    first_name: 'John',
    email: 'john@example.com',
    bio: 'bio',
    phone_number: '+905554443322',
    phone_verified: true,
    home_location_id: 34,
  };

  const mockLocations = [
    { id: 34, name_tr: 'Istanbul', level: 'province' },
    { id: 6, name_tr: 'Ankara', level: 'province' },
  ];

  const mockUpdateMutate = jest.fn();
  const mockVerifyEmailMutateAsync = jest.fn();
  const mockUploadImage = jest.fn();
  const mockPickImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useProfile)
      .mockReturnValue({ data: mockProfile } as unknown as ReturnType<
        typeof useProfile
      >);
    jest
      .mocked(useLocations)
      .mockReturnValue({ data: mockLocations } as unknown as ReturnType<
        typeof useLocations
      >);
    jest.mocked(useUpdateProfile).mockReturnValue({
      mutate: (data: unknown, { onSuccess }: { onSuccess?: () => void }) => {
        mockUpdateMutate(data);
        onSuccess?.();
      },
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProfile>);
    jest.mocked(useVerifyEmail).mockReturnValue({
      mutateAsync: mockVerifyEmailMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useVerifyEmail>);
    jest.mocked(useCloudinaryUpload).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
    } as unknown as ReturnType<typeof useCloudinaryUpload>);
    jest.mocked(useImagePicker).mockReturnValue({
      imageUri: 'file://path.jpg',
      pickImage: mockPickImage,
    } as unknown as ReturnType<typeof useImagePicker>);
  });

  it('initializes with profile data', () => {
    const { result } = renderHook(() => useEditProfileScenario());
    expect(result.current.selectedLocation).toEqual(mockLocations[0]);
    expect(result.current.phoneNumber).toBe(mockProfile.phone_number);
  });

  it('handles location detection', async () => {
    jest
      .mocked(LocationService.getCurrentLocationData)
      .mockResolvedValue({ city: 'Ankara' } as Awaited<
        ReturnType<typeof LocationService.getCurrentLocationData>
      >);
    jest
      .mocked(LocationService.findMatchingLocation)
      .mockReturnValue(
        mockLocations[1] as unknown as ReturnType<
          typeof LocationService.findMatchingLocation
        >,
      );

    const { result } = renderHook(() => useEditProfileScenario());

    await act(async () => {
      await result.current.handleDetectLocation();
    });

    expect(result.current.selectedLocation).toEqual(mockLocations[1]);
  });

  it('uploads image if URI is local during save', async () => {
    mockUploadImage.mockResolvedValue('https://cloud.com/img.jpg');
    const { result } = renderHook(() => useEditProfileScenario());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockUploadImage).toHaveBeenCalledWith(
      'file://path.jpg',
      'profile',
      'user-1',
    );
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_picture_url: 'https://cloud.com/img.jpg',
      }),
    );
  });
});
