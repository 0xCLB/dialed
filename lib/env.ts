import Constants from 'expo-constants';

type ExpoExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  aiEdgeFunctionUrl?: string;
  revenueCatIosKey?: string;
  revenueCatAndroidKey?: string;
  easProjectId?: string;
  appEnv?: 'development' | 'staging' | 'production';
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const env = {
  supabaseUrl: extra.supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey: extra.supabaseAnonKey ?? 'anon-placeholder',
  aiEdgeFunctionUrl: extra.aiEdgeFunctionUrl ?? '',
  revenueCatIosKey: extra.revenueCatIosKey ?? '',
  revenueCatAndroidKey: extra.revenueCatAndroidKey ?? '',
  easProjectId: extra.easProjectId ?? '',
  appEnv: extra.appEnv ?? 'development',
};

export const isSupabaseConfigured =
  env.supabaseUrl !== 'https://placeholder.supabase.co' &&
  env.supabaseAnonKey !== 'anon-placeholder';

export const isRevenueCatConfigured = Boolean(env.revenueCatIosKey || env.revenueCatAndroidKey);
