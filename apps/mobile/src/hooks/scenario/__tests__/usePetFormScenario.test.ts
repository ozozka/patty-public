import type { SpeciesWithBreeds } from '@patty/contracts';
import { useNavigation, useRoute } from '@react-navigation/native';
import { act, renderHook } from '@testing-library/react-native';

import {
  useCreatePet,
  useDeletePet,
  usePetTypes,
  useUpdatePet,
} from '../../api/usePetApi';
import { useProfile } from '../../api/useUserApi';
import { useCloudinaryUpload } from '../../feature/useCloudinaryUpload';
import { useImagePicker } from '../../feature/useImagePicker';
import { usePetFormScenario } from '../usePetFormScenario';

// Mocks
jest.mock('../../api/usePetApi');
jest.mock('../../api/useUserApi');
jest.mock('../../feature/useCloudinaryUpload');
jest.mock('../../feature/useImagePicker');

jest.mock('src/service/PetService', () => ({
  PetService: {
    addPhoto: jest.fn().mockResolvedValue({}),
    removePhoto: jest.fn().mockResolvedValue({}),
    reorderPhotos: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('src/store/useUIStore', () => {
  const showAlert = jest.fn();
  const hideAlert = jest.fn();
  return {
    useUIStore: jest.fn(
      (
        selector?: (s: {
          showAlert: typeof showAlert;
          hideAlert: typeof hideAlert;
        }) => unknown,
      ) => {
        const state = { showAlert, hideAlert };
        return selector ? selector(state) : state;
      },
    ),
    __getShowAlert: () => showAlert,
    __getHideAlert: () => hideAlert,
  };
});

global.alert = jest.fn();

describe('usePetFormScenario', () => {
  const mockGoBack = jest.fn();
  const mockAddMutate = jest.fn();
  const mockUpdateMutate = jest.fn();
  const mockDeleteMutate = jest.fn();
  const mockUploadImage = jest.fn();
  const mockPickImage = jest.fn();
  const mockTakePhoto = jest.fn();

  const mockSpecies: SpeciesWithBreeds[] = [
    {
      id: 1,
      name_en: 'Dog',
      name_tr: 'Köpek',
      breeds: [
        { id: 101, species_id: 1, name_en: 'Retriever', name_tr: 'Retriever' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useNavigation)
      .mockReturnValue({ goBack: mockGoBack } as unknown as ReturnType<
        typeof useNavigation
      >);
    jest
      .mocked(useRoute)
      .mockReturnValue({ params: {} } as unknown as ReturnType<
        typeof useRoute
      >);
    jest.mocked(useCreatePet).mockReturnValue({
      mutate: mockAddMutate,
      isPending: false,
      mutateAsync: mockAddMutate,
    } as unknown as ReturnType<typeof useCreatePet>);
    jest.mocked(useUpdatePet).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
      mutateAsync: mockUpdateMutate,
    } as unknown as ReturnType<typeof useUpdatePet>);
    jest.mocked(useDeletePet).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      mutateAsync: mockDeleteMutate,
    } as unknown as ReturnType<typeof useDeletePet>);
    jest.mocked(usePetTypes).mockReturnValue({
      data: mockSpecies,
      isLoading: false,
    } as unknown as ReturnType<typeof usePetTypes>);
    jest
      .mocked(useProfile)
      .mockReturnValue({ data: { pets: [] } } as unknown as ReturnType<
        typeof useProfile
      >);
    jest.mocked(useCloudinaryUpload).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
    } as unknown as ReturnType<typeof useCloudinaryUpload>);
    jest.mocked(useImagePicker).mockReturnValue({
      pickImage: mockPickImage,
      takePhoto: mockTakePhoto,
    } as unknown as ReturnType<typeof useImagePicker>);

    mockPickImage.mockResolvedValue({
      canceled: false,
      uri: 'test-uri',
      uris: ['test-uri'],
    });

    // Make mutate call onSuccess so async handleSave can complete
    mockAddMutate.mockImplementation(
      (_: unknown, callbacks?: { onSuccess?: () => void }) => {
        callbacks?.onSuccess?.();
        return Promise.resolve();
      },
    );
    mockUpdateMutate.mockImplementation(
      (_: unknown, callbacks?: { onSuccess?: () => void }) => {
        callbacks?.onSuccess?.();
        return Promise.resolve();
      },
    );
  });

  it('handles add pet successfully', async () => {
    const { result } = renderHook(() => usePetFormScenario({ mode: 'add' }));

    act(() => {
      const breed = mockSpecies[0]?.breeds[0];
      result.current.setName('Rex');
      if (mockSpecies[0]) {
        result.current.handleSpeciesSelect(mockSpecies[0]);
      }
      if (breed) {
        result.current.setSelectedBreed(breed);
      }
      result.current.setGender('male');
      result.current.setMatchingPreferences(['female']);
    });

    // Add minimum 2 photos required
    await act(async () => {
      await result.current.addPhotoFromLibrary();
    });
    await act(async () => {
      await result.current.addPhotoFromLibrary();
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockAddMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Rex',
        breed_id: 101,
      }),
    );
  });

  it('handles edit pet and initialization', async () => {
    const mockPet = {
      id: 'pet-1',
      name: 'Buddy',
      breed_id: 101,
      birth_date: null,
      gender: 'male',
      photos: [
        { id: 'photo-1', image_url: 'url1' },
        { id: 'photo-2', image_url: 'url2' },
      ],
    };
    jest
      .mocked(useRoute)
      .mockReturnValue({ params: { petId: 'pet-1' } } as unknown as ReturnType<
        typeof useRoute
      >);
    jest
      .mocked(useProfile)
      .mockReturnValue({ data: { pets: [mockPet] } } as unknown as ReturnType<
        typeof useProfile
      >);

    const { result } = renderHook(() => usePetFormScenario({ mode: 'edit' }));

    expect(result.current.name).toBe('Buddy');

    act(() => {
      const breed = mockSpecies[0]?.breeds[0];
      result.current.setName('Buddy Updated');
      if (mockSpecies[0]) {
        result.current.handleSpeciesSelect(mockSpecies[0]);
      }
      if (breed) {
        result.current.setSelectedBreed(breed);
      }
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pet-1',
        data: expect.objectContaining({
          name: 'Buddy Updated',
        }),
      }),
    );
  });

  it('shows confirmation alert for pet deletion', () => {
    const mockPet = {
      id: 'pet-1',
      name: 'Buddy',
      breed_id: 101,
      birth_date: null,
      gender: 'male',
      photos: [],
    };
    jest
      .mocked(useProfile)
      .mockReturnValue({ data: { pets: [mockPet] } } as unknown as ReturnType<
        typeof useProfile
      >);
    jest
      .mocked(useRoute)
      .mockReturnValue({ params: { petId: 'pet-1' } } as unknown as ReturnType<
        typeof useRoute
      >);

    const { __getShowAlert } = require('src/store/useUIStore');
    const showAlertFn = __getShowAlert();

    const { result } = renderHook(() => usePetFormScenario({ mode: 'edit' }));

    act(() => {
      result.current.handleDelete?.();
    });

    expect(showAlertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        message: expect.any(String),
        buttons: expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            onPress: expect.any(Function),
          }),
          expect.objectContaining({
            text: expect.any(String),
            onPress: expect.any(Function),
          }),
        ]),
      }),
    );
  });
});
