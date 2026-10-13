/**
 * Unit tests for useLocationPicker.
 */
import type { Location } from '@patty/contracts';
import { act, renderHook } from '@testing-library/react-native';

import { useLocationPicker } from '../useLocationPicker';

// --- Mocks ---

const mockUseLocations = jest.fn();
jest.mock('src/hooks/api/useLocationApi', () => ({
  useLocations: () => mockUseLocations(),
}));

const mockGetCurrentLocationData = jest.fn();
const mockFindMatchingLocation = jest.fn();
jest.mock('src/service/LocationService', () => ({
  LocationService: {
    getCurrentLocationData: (...args: unknown[]) =>
      mockGetCurrentLocationData(...args),
    resolveLocation: (...args: unknown[]) => mockFindMatchingLocation(...args),
  },
}));

// --- Helpers ---

function makeLocation(
  id: number,
  name: string,
  level: 'province' | 'district' = 'province',
  parent_id: number | null = null,
): Location {
  return { id, name_tr: name, name_en: name, level, parent_id };
}

// --- Tests ---

describe('useLocationPicker', () => {
  beforeEach(() => {
    mockUseLocations.mockReset();
    mockGetCurrentLocationData.mockReset();
    mockFindMatchingLocation.mockReset();
  });

  it('starts with no selected location', () => {
    mockUseLocations.mockReturnValue({ data: [] });
    const { result } = renderHook(() => useLocationPicker());
    expect(result.current.selectedProvince).toBeNull();
    expect(result.current.selectedDistrict).toBeNull();
  });

  it('exposes the location list from useLocations', () => {
    const locations = [makeLocation(1, 'Istanbul'), makeLocation(2, 'Ankara')];
    mockUseLocations.mockReturnValue({ data: locations });
    const { result } = renderHook(() => useLocationPicker());
    expect(result.current.locations).toEqual(locations);
  });

  it('returns empty array when useLocations has no data', () => {
    mockUseLocations.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useLocationPicker());
    expect(result.current.locations).toEqual([]);
  });

  describe('selection logic', () => {
    it('sets selectedProvince', () => {
      const location = makeLocation(1, 'Istanbul');
      mockUseLocations.mockReturnValue({ data: [location] });
      const { result } = renderHook(() => useLocationPicker());

      act(() => {
        result.current.selectProvince(location);
      });

      expect(result.current.selectedProvince).toEqual(location);
      expect(result.current.selectedDistrict).toBeNull();
    });

    it('sets selectedDistrict and calls onSelect', () => {
      const province = makeLocation(1, 'Istanbul');
      const district = makeLocation(10, 'Kadikoy', 'district', 1);
      mockUseLocations.mockReturnValue({ data: [province, district] });
      const onSelect = jest.fn();

      const { result } = renderHook(() => useLocationPicker({ onSelect }));

      act(() => {
        result.current.selectProvince(province);
      });

      act(() => {
        result.current.selectDistrict(district);
      });

      expect(result.current.selectedDistrict).toEqual(district);
      expect(onSelect).toHaveBeenCalledWith(district);
    });
  });

  describe('auto-detection', () => {
    it('auto-selects a location when GPS returns a match', async () => {
      const location = makeLocation(34, 'Istanbul');
      mockUseLocations.mockReturnValue({ data: [location] });
      mockGetCurrentLocationData.mockResolvedValue({
        coords: { latitude: 41.0, longitude: 28.9 },
      });
      mockFindMatchingLocation.mockResolvedValue(location);

      const { result } = renderHook(() => useLocationPicker());

      await act(async () => {
        await result.current.handleAutoDetect();
      });

      expect(result.current.selectedProvince).toEqual(location);
    });

    it('calls onSelect with the auto-detected location', async () => {
      const location = makeLocation(34, 'Istanbul');
      mockUseLocations.mockReturnValue({ data: [location] });
      mockGetCurrentLocationData.mockResolvedValue({
        coords: { latitude: 41.0, longitude: 28.9 },
      });
      mockFindMatchingLocation.mockResolvedValue(location);
      const onSelect = jest.fn();

      const { result } = renderHook(() => useLocationPicker({ onSelect }));

      await act(async () => {
        await result.current.handleAutoDetect();
      });

      expect(onSelect).toHaveBeenCalledWith(location);
    });
  });
});
