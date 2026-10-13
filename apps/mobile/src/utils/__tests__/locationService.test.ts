import type { Location } from '@patty/contracts';

import type { ReverseGeocodeData } from '../../service/LocationService';
import { LocationService } from '../../service/LocationService';

const mockLocations: Location[] = [
  {
    id: 1,
    name_tr: 'İstanbul',
    name_en: 'Istanbul',
    level: 'province',
    parent_id: null,
  },
  {
    id: 2,
    name_tr: 'Ankara',
    name_en: 'Ankara',
    level: 'province',
    parent_id: null,
  },
  {
    id: 3,
    name_tr: 'İzmir',
    name_en: 'Izmir',
    level: 'province',
    parent_id: null,
  },
  {
    id: 4,
    name_tr: 'Kadıköy',
    name_en: 'Kadikoy',
    level: 'district',
    parent_id: 1,
  },
  {
    id: 5,
    name_tr: 'Kocaeli',
    name_en: 'Kocaeli',
    level: 'province',
    parent_id: null,
  },
];

describe('LocationService', () => {
  describe('normalize', () => {
    it('converts Turkish characters to ASCII equivalents', () => {
      expect(LocationService.normalize('İstanbul')).toBe('istanbul');
      expect(LocationService.normalize('ANKARA')).toBe('ankara');
      expect(LocationService.normalize('İzmir')).toBe('izmir');
    });

    it('handles Turkish specific characters', () => {
      expect(LocationService.normalize('ğüşöç')).toBe('gusoc');
      expect(LocationService.normalize('ĞÜŞÖÇ')).toBe('gusoc');
    });

    it('handles empty string', () => {
      expect(LocationService.normalize('')).toBe('');
    });

    it('handles whitespace trimming', () => {
      expect(LocationService.normalize('  Istanbul  ')).toBe('istanbul');
    });
  });

  describe('findMatchingLocation', () => {
    it('returns null when locationData is null', () => {
      const result = LocationService.findMatchingLocation(null, mockLocations);
      expect(result).toBeNull();
    });

    it('matches by district name', () => {
      const locationData: ReverseGeocodeData = {
        district: 'Kadıköy',
        subregion: null,
        city: 'İstanbul',
        region: 'İstanbul',
      };

      const result = LocationService.findMatchingLocation(
        locationData,
        mockLocations,
      );
      expect(result).not.toBeNull();
      expect(result?.name_en).toBe('Kadikoy');
    });

    it('matches by city name', () => {
      const locationData: ReverseGeocodeData = {
        district: null,
        subregion: null,
        city: 'Ankara',
        region: 'Ankara',
      };

      const result = LocationService.findMatchingLocation(
        locationData,
        mockLocations,
      );
      expect(result).not.toBeNull();
      expect(result?.name_en).toBe('Ankara');
    });

    it('matches by region name (province)', () => {
      const locationData: ReverseGeocodeData = {
        district: null,
        subregion: null,
        city: null,
        region: 'İzmir',
      };

      const result = LocationService.findMatchingLocation(
        locationData,
        mockLocations,
      );
      expect(result).not.toBeNull();
      expect(result?.name_en).toBe('Izmir');
    });

    it('returns null when no match found', () => {
      const locationData: ReverseGeocodeData = {
        district: null,
        subregion: null,
        city: null,
        region: 'NonExistentCity',
      };

      const result = LocationService.findMatchingLocation(
        locationData,
        mockLocations,
      );
      expect(result).toBeNull();
    });

    it('handles shorthand city names', () => {
      const locationData: ReverseGeocodeData = {
        district: null,
        subregion: null,
        city: 'İzmit',
        region: 'İzmit',
      };

      const result = LocationService.findMatchingLocation(
        locationData,
        mockLocations,
      );
      expect(result).not.toBeNull();
      expect(result?.name_en).toBe('Kocaeli');
    });
  });
});
