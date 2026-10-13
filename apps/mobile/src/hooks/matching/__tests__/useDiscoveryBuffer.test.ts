import type { PetCandidate } from '@patty/contracts';
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';

import { useCandidates } from '../../api/useMatchingApi';
import { useDiscoveryBuffer } from '../useDiscoveryBuffer';

jest.mock('../../api/useMatchingApi', () => ({
  useCandidates: jest.fn(),
}));

const mockCandidates: PetCandidate[] = [
  {
    id: '1',
    account_id: 'user-1',
    name: 'Pet 1',
    breed_id: 1,
    breed_name: 'Golden',
    photos: [],
    gender: 'male',
    created_at: '2026-01-01T00:00:00Z',
    distance_m: 1000,
    location_name: 'Istanbul',
    energy_level: 3,
  },
  {
    id: '2',
    account_id: 'user-2',
    name: 'Pet 2',
    breed_id: 1,
    breed_name: 'Golden',
    photos: [],
    gender: 'male',
    created_at: '2026-01-01T00:00:00Z',
    distance_m: 1000,
    location_name: 'Istanbul',
    energy_level: 3,
  },
  {
    id: '3',
    account_id: 'user-3',
    name: 'Pet 3',
    breed_id: 1,
    breed_name: 'Golden',
    photos: [],
    gender: 'male',
    created_at: '2026-01-01T00:00:00Z',
    distance_m: 1000,
    location_name: 'Istanbul',
    energy_level: 3,
  },
  {
    id: '4',
    account_id: 'user-4',
    name: 'Pet 4',
    breed_id: 1,
    breed_name: 'Golden',
    photos: [],
    gender: 'male',
    created_at: '2026-01-01T00:00:00Z',
    distance_m: 1000,
    location_name: 'Istanbul',
    energy_level: 3,
  },
];

describe('useDiscoveryBuffer', () => {
  let refetchMock: jest.Mock;

  beforeEach(() => {
    refetchMock = jest.fn().mockResolvedValue({ data: { candidates: [] } });
    jest.mocked(useCandidates).mockReturnValue({
      data: { candidates: [] },
      isLoading: false,
      refetch: refetchMock,
      isFetching: false,
    } as unknown as ReturnType<typeof useCandidates>);
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes with empty buffer', () => {
    const { result } = renderHook(() => useDiscoveryBuffer(null));
    expect(result.current.buffer).toEqual([]);
  });

  it('refills buffer when data is provided', async () => {
    const { result, rerender } = renderHook(
      ({ petId }: { petId: string | null }) => useDiscoveryBuffer(petId),
      {
        initialProps: { petId: 'active-pet' },
      },
    );

    jest.mocked(useCandidates).mockReturnValue({
      data: { candidates: mockCandidates },
      isLoading: false,
      refetch: refetchMock,
      isFetching: false,
    } as unknown as ReturnType<typeof useCandidates>);

    rerender({ petId: 'active-pet' });

    await waitFor(() => {
      expect(result.current.buffer.length).toBe(4);
    });
    expect(result.current.buffer[0]?.name).toBe('Pet 1');
  });

  it('popCandidate removes the first item', async () => {
    const { result, rerender } = renderHook(
      ({ petId }: { petId: string | null }) => useDiscoveryBuffer(petId),
      {
        initialProps: { petId: 'active-pet' },
      },
    );

    jest.mocked(useCandidates).mockReturnValue({
      data: { candidates: mockCandidates },
      isLoading: false,
      refetch: refetchMock,
      isFetching: false,
    } as unknown as ReturnType<typeof useCandidates>);

    rerender({ petId: 'active-pet' });

    await waitFor(() => expect(result.current.buffer.length).toBe(4));

    act(() => {
      result.current.popCandidate();
    });

    expect(result.current.buffer.length).toBe(3);
    expect(result.current.buffer[0]?.name).toBe('Pet 2');
  });

  it('triggers refetch when buffer is below threshold', async () => {
    jest.mocked(useCandidates).mockReturnValue({
      data: { candidates: mockCandidates.slice(0, 3) }, // Exactly threshold
      isLoading: false,
      refetch: refetchMock,
      isFetching: false,
    } as unknown as ReturnType<typeof useCandidates>);

    const { result, rerender } = renderHook(
      ({ petId }: { petId: string | null }) => useDiscoveryBuffer(petId),
      {
        initialProps: { petId: 'active-pet' },
      },
    );

    // Trigger buffer population from data
    rerender({ petId: 'active-pet' });

    await waitFor(() => expect(result.current.buffer.length).toBe(3));

    act(() => {
      result.current.popCandidate(); // length becomes 2 (< 3)
    });

    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
    });
  });
});
