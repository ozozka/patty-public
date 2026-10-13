import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import {
  useCreatePet,
  useDeletePet,
  usePetTypes,
  useUpdatePet,
} from '../../api/usePetApi';
import { useProfile, useUpdateProfile } from '../../api/useUserApi';
import { useCloudinaryUpload } from '../../feature/useCloudinaryUpload';
import { useProfileScenario } from '../useProfileScenario';

// Mocks
jest.mock('../../api/useUserApi');
jest.mock('../../api/usePetApi');
jest.mock('../../feature/useCloudinaryUpload');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useProfileScenario', () => {
  const mockUpdateProfileMutateAsync = jest.fn();
  const mockAddPetMutateAsync = jest.fn();
  const mockDeletePetMutateAsync = jest.fn();
  const mockUploadImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useProfile).mockReturnValue({
      data: { id: 'user-123', username: 'test' },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfile>);
    jest
      .mocked(usePetTypes)
      .mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
        typeof usePetTypes
      >);
    jest.mocked(useUpdateProfile).mockReturnValue({
      mutateAsync: mockUpdateProfileMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProfile>);
    jest.mocked(useCreatePet).mockReturnValue({
      mutateAsync: mockAddPetMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePet>);
    jest.mocked(useUpdatePet).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdatePet>);
    jest.mocked(useDeletePet).mockReturnValue({
      mutateAsync: mockDeletePetMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeletePet>);
    jest.mocked(useCloudinaryUpload).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
    } as unknown as ReturnType<typeof useCloudinaryUpload>);
  });

  it('handles update profile with image upload', async () => {
    mockUploadImage.mockResolvedValue('https://cloud.com/img.jpg');
    const { result } = renderHook(() => useProfileScenario(), { wrapper });

    await act(async () => {
      await result.current.handleUpdateProfile(
        { first_name: 'John' },
        'file://local.jpg',
      );
    });

    expect(mockUploadImage).toHaveBeenCalledWith(
      'file://local.jpg',
      'profile',
      'user-123',
    );
    expect(mockUpdateProfileMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        profile_picture_url: 'https://cloud.com/img.jpg',
      }),
    );
  });

  it('handles add pet', async () => {
    mockAddPetMutateAsync.mockResolvedValue({ id: 'pet-123' });
    const { result } = renderHook(() => useProfileScenario(), { wrapper });

    await act(async () => {
      await result.current.handleAddPet({
        name: 'Rex',
        breed_id: 1,
        gender: 'male',
        matching_preferences: ['female'],
      });
    });

    expect(mockAddPetMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rex' }),
    );
  });

  it('handles delete pet', async () => {
    const { result } = renderHook(() => useProfileScenario(), { wrapper });

    await act(async () => {
      await result.current.handleDeletePet('pet-123');
    });

    expect(mockDeletePetMutateAsync).toHaveBeenCalledWith('pet-123');
  });

  it('refreshes profile', () => {
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useProfileScenario(), { wrapper });

    act(() => {
      result.current.refreshProfile();
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ['profile'] });
  });
});
