import Constants from 'expo-constants';

type ExpoExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  revenueCatApiKey?: string;
  easProjectId?: string;
  appEnv?: 'development' | 'staging' | 'production';
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const env = {
  supabaseUrl: extra.supabaseUrl ?? '',
  supabaseAnonKey: extra.supabaseAnonKey ?? '',
  revenueCatApiKey: extra.revenueCatApiKey ?? '',
  easProjectId: extra.easProjectId ?? '',
  appEnv: extra.appEnv ?? 'development',
};

export const isSupabaseConfigured =
  env.supabaseUrl.startsWith('https://') && Boolean(env.supabaseAnonKey);

export const isRevenueCatConfigured = Boolean(env.revenueCatApiKey);

export function assertSupabaseEnv() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Missing Supabase environment. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your local .env file.',
    );
  }
}
