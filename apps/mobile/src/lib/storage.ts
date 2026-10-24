import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Universal Storage Helper
 * Persists data across app refreshes, restarts, and web sessions.
 */
export const Storage = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] Failed to read ${key}:`, e);
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, json);
        return;
      }
      await AsyncStorage.setItem(key, json);
    } catch (e) {
      console.warn(`[Storage] Failed to save ${key}:`, e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove ${key}:`, e);
    }
  },
};
