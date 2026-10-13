import type { PetCandidate } from '@patty/contracts';
import { useEffect, useRef, useState } from 'react';
import { useCandidates } from 'src/hooks/api/useMatchingApi';

const BUFFER_SIZE = 10;
const REFILL_THRESHOLD = 3;

/**
 * Hook to manage a local buffer of discovery candidates.
 * Prefetches and deduplicates candidates to ensure a smooth swiping experience.
 */
export function useDiscoveryBuffer(
  activePetId: string | null,
  radiusKm?: number | null,
) {
  const [buffer, setBuffer] = useState<PetCandidate[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  const {
    data: fetchedCandidates,
    isLoading,
    isFetching,
    refetch,
  } = useCandidates(activePetId, BUFFER_SIZE, radiusKm ?? 50);

  // Add new candidates to buffer when fetched
  useEffect(() => {
    if (
      fetchedCandidates?.candidates &&
      fetchedCandidates.candidates.length > 0
    ) {
      const newCandidates = fetchedCandidates.candidates.filter(
        (c) => !seenIds.current.has(c.id),
      );

      if (newCandidates.length > 0) {
        newCandidates.forEach((c) => seenIds.current.add(c.id));
        setBuffer((prev) => [...prev, ...newCandidates]);
      }
    }
  }, [fetchedCandidates]);

  const popCandidate = (): PetCandidate | null => {
    if (buffer.length === 0) return null;

    const [first, ...rest] = buffer;
    setBuffer(rest);

    // Trigger refill if buffer gets low
    if (rest.length <= REFILL_THRESHOLD && !isFetching) {
      void refetch();
    }

    return first ?? null;
  };

  const pushBack = (candidate: PetCandidate) => {
    seenIds.current.delete(candidate.id);
    setBuffer((prev) => [candidate, ...prev]);
  };

  const clearBuffer = () => {
    setBuffer([]);
    seenIds.current.clear();
    void refetch();
  };

  return {
    buffer,
    popCandidate,
    pushBack,
    clearBuffer,
    isLoading: isLoading && buffer.length === 0,
    isRefilling: isFetching,
  };
}
