import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Account, AppData } from './types';

const STORAGE_KEY = 'ultimate-fitness-v1';

export const EMPTY_DATA: AppData = { accounts: [], activeEmail: null };

export async function loadData(): Promise<AppData> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return EMPTY_DATA;

  try {
    const value = JSON.parse(stored) as AppData;
    if (!Array.isArray(value.accounts)) return EMPTY_DATA;
    return { accounts: value.accounts, activeEmail: value.activeEmail ?? null };
  } catch {
    return EMPTY_DATA;
  }
}

export const saveData = (data: AppData) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export async function makeCredential(password: string) {
  const salt = Array.from(Crypto.getRandomBytes(16), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const passwordHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
  return { salt, passwordHash };
}

export async function matchesPassword(account: Account, password: string) {
  const candidate = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${account.salt}:${password}`,
  );
  return candidate === account.passwordHash;
}
