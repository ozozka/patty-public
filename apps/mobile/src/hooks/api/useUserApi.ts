import type {
  ChangePasswordRequest,
  ProfileResponse,
  PublicProfileResponse,
  UpdateUserRequest,
} from '@patty/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from 'src/hooks/api/useApiMutation';
import { QueryKeys } from 'src/lib/queryKeys';
import { UserService } from 'src/service/UserService';

/**
 * Standard staleTime for profile data to prevent excessive refetching.
 */
const PROFILE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useProfile() {
  return useQuery<ProfileResponse>({
    queryKey: QueryKeys.profile(),
    queryFn: () => UserService.getProfile(),
    staleTime: PROFILE_STALE_TIME,
  });
}

export function usePublicProfile(id: string | null) {
  return useQuery<PublicProfileResponse>({
    queryKey: QueryKeys.publicProfile(id),
    queryFn: () => {
      if (!id) throw new Error('id is required');
      return UserService.getPublicProfile(id);
    },
    enabled: !!id,
    staleTime: PROFILE_STALE_TIME,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (data: UpdateUserRequest) => UserService.updateProfile(data),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QueryKeys.profile() });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<ProfileResponse>(
        QueryKeys.profile(),
      );

      // Optimistically update to the new value
      if (previousProfile) {
        const updatedProfile: ProfileResponse = {
          ...previousProfile,
          ...newData,
          // Handle nullable fields correctly
          bio: newData.bio === undefined ? previousProfile.bio : newData.bio,
          phone_number:
            newData.phone_number === undefined
              ? previousProfile.phone_number
              : newData.phone_number,
          profile_picture_url:
            newData.profile_picture_url === undefined
              ? previousProfile.profile_picture_url
              : newData.profile_picture_url,
        };
        queryClient.setQueryData<ProfileResponse>(
          QueryKeys.profile(),
          updatedProfile,
        );
      }

      return { previousProfile };
    },
    onError: (err, newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(QueryKeys.profile(), context.previousProfile);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
    },
  });
}

export function useUpdateTheme() {
  return useApiMutation({
    mutationFn: (theme: string) => UserService.updateProfile({ theme }),
    // No invalidation — theme is persisted in Zustand; server sync is fire-and-forget
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: ({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) => UserService.updateLocation(latitude, longitude),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QueryKeys.profile() });
    },
  });
}

export function useChangePassword() {
  return useApiMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      UserService.changePassword(data),
  });
}
