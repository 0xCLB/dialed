import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { assertSupabaseEnv, env } from '@/lib/env';

const memoryStorage = new Map<string, string>();

const ssrSafeWebStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') {
      return memoryStorage.get(key) ?? null;
    }
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') {
      memoryStorage.set(key, value);
      return;
    }
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') {
      memoryStorage.delete(key);
      return;
    }
    window.localStorage.removeItem(key);
  },
};

assertSupabaseEnv();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? ssrSafeWebStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'dialed-self-mobile',
    },
  },
});
