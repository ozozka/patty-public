import type { PetRequest } from '@patty/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from 'src/hooks/api/useApiMutation';
import { QueryKeys } from 'src/lib/queryKeys';
import { PetService } from 'src/service/PetService';

export function usePetTypes() {
  return useQuery({
    queryKey: QueryKeys.petTypes(),
    queryFn: () => PetService.getPetTypes(),
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (data: PetRequest) => PetService.createPet(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: PetRequest }) =>
      PetService.updatePet(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (id: string) => PetService.deletePet(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
      void queryClient.invalidateQueries({ queryKey: QueryKeys.deletedPets() });
    },
  });
}

export function useRestorePet() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (id: string) => PetService.restorePet(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
      void queryClient.invalidateQueries({ queryKey: QueryKeys.deletedPets() });
    },
  });
}

export function useDeletedPets() {
  return useQuery({
    queryKey: QueryKeys.deletedPets(),
    queryFn: () => PetService.getDeletedPets(),
  });
}
