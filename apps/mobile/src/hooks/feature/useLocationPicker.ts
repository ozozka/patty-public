/**
 * Encapsulates hierarchical location selection (Province -> District)
 * and GPS-based auto-resolution.
 */
import type { Location as LocationType } from '@patty/contracts';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocations } from 'src/hooks/api/useLocationApi';
import { LocationService } from 'src/service/LocationService';
import { logger } from 'src/utils/logger';

export interface UseLocationPickerOptions {
  /** Initial location ID if editing */
  initialLocationId?: number | null;
  /** Called when a final location (usually a district) is selected */
  onSelect?: (location: LocationType) => void;
}

export interface UseLocationPickerReturn {
  locations: LocationType[];
  provinces: LocationType[];
  /** Filtered districts for the currently selected province */
  districts: LocationType[];

  selectedProvince: LocationType | null;
  selectedDistrict: LocationType | null;

  isDetecting: boolean;
  isLoading: boolean;

  /** Select a province and reset district */
  selectProvince: (province: LocationType | null) => void;
  /** Select a district (final choice) */
  selectDistrict: (district: LocationType | null) => void;
  /** Clear both province and district */
  clearSelection: () => void;
  /** Use GPS to resolve location automatically */
  handleAutoDetect: () => Promise<void>;
}

export function useLocationPicker(
  options: UseLocationPickerOptions = {},
): UseLocationPickerReturn {
  const { onSelect, initialLocationId } = options;
  const { data: rawLocations, isLoading } = useLocations();

  const locations = useMemo(() => rawLocations ?? [], [rawLocations]);

  const provinces = useMemo(
    () => locations.filter((l) => l.level === 'province'),
    [locations],
  );

  const [selectedProvince, setSelectedProvince] = useState<LocationType | null>(
    null,
  );
  const [selectedDistrict, setSelectedDistrict] = useState<LocationType | null>(
    null,
  );
  const [isDetecting, setIsDetecting] = useState(false);

  // Initialize from ID
  useEffect(() => {
    if (initialLocationId && locations.length > 0) {
      const loc = locations.find((l) => l.id === initialLocationId);
      if (loc) {
        if (loc.level === 'district') {
          const parent = locations.find((p) => p.id === loc.parent_id);
          setSelectedProvince(parent ?? null);
          setSelectedDistrict(loc);
        } else {
          setSelectedProvince(loc);
          setSelectedDistrict(null);
        }
      }
    }
  }, [initialLocationId, locations]);

  const districts = useMemo(() => {
    if (!selectedProvince) return [];
    return locations.filter((l) => l.parent_id === selectedProvince.id);
  }, [selectedProvince, locations]);

  const selectProvince = useCallback(
    (province: LocationType | null) => {
      setSelectedProvince(province);
      setSelectedDistrict(null);
      // If it's a province with no districts (edge case), select it as final
      if (province && !locations.some((l) => l.parent_id === province.id)) {
        onSelect?.(province);
      }
    },
    [locations, onSelect],
  );

  const selectDistrict = useCallback(
    (district: LocationType | null) => {
      setSelectedDistrict(district);
      if (district) {
        onSelect?.(district);
      }
    },
    [onSelect],
  );

  const clearSelection = useCallback(() => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
  }, []);

  const handleAutoDetect = useCallback(async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const resolved = await LocationService.resolveLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (resolved) {
        if (resolved.level === 'district') {
          const parent = locations.find((p) => p.id === resolved.parent_id);
          setSelectedProvince(parent ?? null);
          setSelectedDistrict(resolved);
        } else {
          setSelectedProvince(resolved);
          setSelectedDistrict(null);
        }
        onSelect?.(resolved);
      }
    } catch (error) {
      logger.error('Auto-detect failed', { error });
    } finally {
      setIsDetecting(false);
    }
  }, [locations, onSelect]);

  return {
    locations,
    provinces,
    districts,
    selectedProvince,
    selectedDistrict,
    isDetecting,
    isLoading,
    selectProvince,
    selectDistrict,
    clearSelection,
    handleAutoDetect,
  };
}
