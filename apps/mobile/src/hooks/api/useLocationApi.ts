/** Hook for fetching locations. */
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from 'src/lib/queryKeys';
import { LocationService } from 'src/service/LocationService';

const ONE_DAY = 1000 * 60 * 60 * 24;

export const useLocations = () => {
  return useQuery({
    queryKey: QueryKeys.locations(),
    queryFn: () => LocationService.getLocations(),
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
    refetchOnMount: false,
  });
};
