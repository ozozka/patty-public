/**
 * Store for managing matching-related state, specifically the active pet.
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from 'src/utils/logger';
import { create } from 'zustand';

/**
 * State and actions for matching.
 */
export interface MatchingState {
  activePetId: string | null;
  radiusKm: number | null;
  setActivePetId: (petId: string | null) => Promise<boolean>;
  setRadiusKm: (radius: number | null) => Promise<boolean>;
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
}

/**
 * Zustand store for matching state.
 */
export const useMatchingStore = create<MatchingState>((set) => ({
  activePetId: null,
  radiusKm: null,

  setActivePetId: async (petId: string | null): Promise<boolean> => {
    try {
      if (petId) {
        await SecureStore.setItemAsync('activePetId', petId);
      } else {
        await SecureStore.deleteItemAsync('activePetId');
      }
      set({ activePetId: petId });
      return true;
    } catch (e) {
      logger.error('Error saving active pet ID', { error: e });
      return false;
    }
  },

  setRadiusKm: async (radius: number | null): Promise<boolean> => {
    try {
      if (radius != null) {
        await SecureStore.setItemAsync('radiusKm', radius.toString());
      } else {
        await SecureStore.deleteItemAsync('radiusKm');
      }
      set({ radiusKm: radius });
      return true;
    } catch (e) {
      logger.error('Error saving radius filter', { error: e });
      return false;
    }
  },

  initialize: async () => {
    try {
      const [savedId, savedRadius] = await Promise.all([
        SecureStore.getItemAsync('activePetId'),
        SecureStore.getItemAsync('radiusKm'),
      ]);

      set({
        activePetId: savedId,
        radiusKm: savedRadius ? parseFloat(savedRadius) : null,
      });
    } catch (e) {
      logger.error('Error loading matching store', { error: e });
    }
  },

  reset: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('activePetId'),
        SecureStore.deleteItemAsync('radiusKm'),
      ]);
      set({ activePetId: null, radiusKm: null });
    } catch (e) {
      logger.error('Error resetting matching store', { error: e });
    }
  },
}));
