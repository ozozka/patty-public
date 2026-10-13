import { act, renderHook } from '@testing-library/react-native';
import { useUpdateProfile } from 'src/hooks/api/useUserApi';
import { useCloudinaryUpload } from 'src/hooks/feature/useCloudinaryUpload';
import { useImagePicker } from 'src/hooks/feature/useImagePicker';
import { useToast } from 'src/hooks/ui/useToast';

import { useUpdateProfilePhotoScenario } from '../useUpdateProfilePhotoScenario';

// Mocks
jest.mock('src/hooks/api/useUserApi');
jest.mock('src/hooks/feature/useCloudinaryUpload');
jest.mock('src/hooks/feature/useImagePicker');
jest.mock('src/hooks/ui/useToast');

describe('useUpdateProfilePhotoScenario', () => {
  const userId = 'user-123';
  const mockUpdateMutateAsync = jest.fn();
  const mockUploadImage = jest.fn();
  const mockPickImage = jest.fn();
  const mockTakePhoto = jest.fn();
  const mockSuccess = jest.fn();
  const mockError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useUpdateProfile).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProfile>);

    jest.mocked(useCloudinaryUpload).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
    } as unknown as ReturnType<typeof useCloudinaryUpload>);

    jest.mocked(useImagePicker).mockReturnValue({
      pickImage: mockPickImage,
      takePhoto: mockTakePhoto,
    } as unknown as ReturnType<typeof useImagePicker>);

    jest.mocked(useToast).mockReturnValue({
      success: mockSuccess,
      error: mockError,
    } as unknown as ReturnType<typeof useToast>);
  });

  it('handles takePhoto and successful update', async () => {
    const localUri = 'file://photo.jpg';
    const remoteUrl = 'https://cloudinary.com/photo.jpg';

    mockTakePhoto.mockResolvedValue({ canceled: false, uri: localUri });
    mockUploadImage.mockResolvedValue(remoteUrl);
    mockUpdateMutateAsync.mockResolvedValue({});

    const { result } = renderHook(() => useUpdateProfilePhotoScenario(userId));

    await act(async () => {
      await result.current.onTakePhoto();
    });

    expect(mockTakePhoto).toHaveBeenCalled();
    expect(mockUploadImage).toHaveBeenCalledWith(localUri, 'profile', userId);
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      profile_picture_url: remoteUrl,
    });
    expect(mockSuccess).toHaveBeenCalled();
  });

  it('handles pickImage and successful update', async () => {
    const localUri = 'file://gallery.jpg';
    const remoteUrl = 'https://cloudinary.com/gallery.jpg';

    mockPickImage.mockResolvedValue({ canceled: false, uri: localUri });
    mockUploadImage.mockResolvedValue(remoteUrl);
    mockUpdateMutateAsync.mockResolvedValue({});

    const { result } = renderHook(() => useUpdateProfilePhotoScenario(userId));

    await act(async () => {
      await result.current.onChooseFromLibrary();
    });

    expect(mockPickImage).toHaveBeenCalled();
    expect(mockUploadImage).toHaveBeenCalledWith(localUri, 'profile', userId);
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      profile_picture_url: remoteUrl,
    });
    expect(mockSuccess).toHaveBeenCalled();
  });

  it('does nothing if picking is canceled', async () => {
    mockPickImage.mockResolvedValue({ canceled: true });

    const { result } = renderHook(() => useUpdateProfilePhotoScenario(userId));

    await act(async () => {
      await result.current.onChooseFromLibrary();
    });

    expect(mockPickImage).toHaveBeenCalled();
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error toast if upload fails', async () => {
    mockPickImage.mockResolvedValue({ canceled: false, uri: 'file://img.jpg' });
    mockUploadImage.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useUpdateProfilePhotoScenario(userId));

    await act(async () => {
      await result.current.onChooseFromLibrary();
    });

    expect(mockError).toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error toast if profile update fails', async () => {
    mockPickImage.mockResolvedValue({ canceled: false, uri: 'file://img.jpg' });
    mockUploadImage.mockResolvedValue('https://cloud.com/img.jpg');
    mockUpdateMutateAsync.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateProfilePhotoScenario(userId));

    await act(async () => {
      await result.current.onChooseFromLibrary();
    });

    expect(mockError).toHaveBeenCalled();
  });

  it('does not proceed if userId is missing', async () => {
    mockPickImage.mockResolvedValue({ canceled: false, uri: 'file://img.jpg' });

    const { result } = renderHook(() =>
      useUpdateProfilePhotoScenario(undefined),
    );

    await act(async () => {
      await result.current.onChooseFromLibrary();
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });
});
