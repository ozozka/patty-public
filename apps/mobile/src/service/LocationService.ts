/** Service for location-related API calls and utilities. */
import type { Location, ResolveLocationParams } from '@patty/contracts';
import { locationSchema } from '@patty/contracts';
import * as LocationAPI from 'expo-location';
import { apiClient } from 'src/api/client';
import { z } from 'zod';

import { BaseService } from './BaseService';

export interface ReverseGeocodeData {
  district: string | null;
  subregion: string | null;
  city: string | null;
  region: string | null;
}

export class LocationService extends BaseService {
  /**
   * Get all provinces and districts.
   */
  static async getLocations(): Promise<Location[]> {
    const response = await apiClient.api.v1.metadata.locations.$get();
    return this.handle(response, z.array(locationSchema));
  }

  /**
   * Resolve coordinates to a location.
   */
  static async resolveLocation(
    params: ResolveLocationParams,
  ): Promise<Location | null> {
    const response = await apiClient.api.v1.metadata.locations.resolve.$get({
      query: {
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
      },
    });
    return this.handle(response, locationSchema.nullable());
  }

  /**
   * Get current device location data using reverse geocoding.
   */
  static async getCurrentLocationData(): Promise<ReverseGeocodeData | null> {
    try {
      const { status } = await LocationAPI.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const pos = await LocationAPI.getCurrentPositionAsync({
        accuracy: LocationAPI.Accuracy.Balanced,
      });

      const [address] = await LocationAPI.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (!address) return null;

      return {
        district: address.district ?? null,
        subregion: address.subregion ?? null,
        city: address.city ?? null,
        region: address.region ?? null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalize a string for comparison (Turkish character mapping).
   */
  static normalize(text: string): string {
    return text
      .trim()
      .replace(/İ/g, 'I')
      .replace(/I/g, 'i')
      .replace(/ı/g, 'i')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/Ğ/g, 'g')
      .replace(/Ü/g, 'u')
      .replace(/Ş/g, 's')
      .replace(/Ö/g, 'o')
      .replace(/Ç/g, 'c');
  }

  /**
   * Find a matching location from a list based on reverse geocoding data.
   */
  static findMatchingLocation(
    locationData: ReverseGeocodeData | null,
    locations: Location[],
  ): Location | null {
    if (!locationData) return null;

    const { district, subregion, city, region } = locationData;
    const searchTerms = [district, subregion, city, region]
      .filter((t): t is string => !!t)
      .map((t) => this.normalize(t));

    // Handle special cases (e.g., İzmit -> Kocaeli)
    if (searchTerms.includes('izmit')) {
      searchTerms.push('kocaeli');
    }

    // Try to find a match in the locations list
    for (const term of searchTerms) {
      const match = locations.find(
        (l) =>
          this.normalize(l.name_tr) === term ||
          this.normalize(l.name_en) === term,
      );
      if (match) return match;
    }

    return null;
  }
}
