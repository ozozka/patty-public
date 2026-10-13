/**
 * Secure storage utility wrapper with safety checks and logging.
 * Specifically designed to handle Android's 2KB limit and provide visibility into failures.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { logger } from './logger';

const ANDROID_LIMIT = 2048; // Android SecureStore limit is approx 2KB

export const Storage = {
  /**
   * Save a value securely.
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && value.length > ANDROID_LIMIT) {
        logger.warn(
          `Value for key "${key}" is ${value.length} bytes, which exceeds Android's 2KB limit. Storage may fail.`,
        );
      }

      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      logger.error(`Failed to save key "${key}"`, { error });
      return false;
    }
  },

  /**
   * Retrieve a securely stored value.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error(`Failed to retrieve key "${key}"`, { error });
      return null;
    }
  },

  /**
   * Delete a securely stored value.
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      logger.error(`Failed to delete key "${key}"`, { error });
      return false;
    }
  },
};
