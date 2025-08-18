import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      const value = localStorage.getItem(key);
      console.log(`SecureStore getItem (web): ${key} = ${value ? 'exists' : 'null'}`);
      return value;
    }
    const value = await SecureStore.getItemAsync(key);
    console.log(`SecureStore getItem (${Platform.OS}): ${key} = ${value ? 'exists' : 'null'}`);
    return value;
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
      console.log(`SecureStore setItem (web): ${key} = set`);
      return;
    }
    await SecureStore.setItemAsync(key, value);
    console.log(`SecureStore setItem (${Platform.OS}): ${key} = set`);
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.removeItem(key);
      console.log(`SecureStore deleteItem (web): ${key} = deleted`);
      return;
    }
    await SecureStore.deleteItemAsync(key);
    console.log(`SecureStore deleteItem (${Platform.OS}): ${key} = deleted`);
  } catch (error) {
    console.error(`Error deleting item ${key}:`, error);
  }
} 