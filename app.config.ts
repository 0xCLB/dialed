import type { ExpoConfig } from 'expo/config';

declare const process: { env: Record<string, string | undefined> };

const config: ExpoConfig = {
  name: 'Dialed Self',
  slug: 'dialed-self',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'dialedself',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F4EE',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID ?? 'com.dialedself.app',
    infoPlist: {
      NSCameraUsageDescription: 'Dialed Self uses the camera so you can capture wellness proof.',
      NSPhotoLibraryUsageDescription:
        'Dialed Self lets you choose photos for wellness proof and share exports.',
      NSPhotoLibraryAddUsageDescription:
        'Dialed Self saves share cards and reels to your photo library when requested.',
      NSLocationWhenInUseUsageDescription:
        'Dialed Self can attach location context to walks, runs, and check-ins.',
    },
  },
  android: {
    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? 'com.dialedself.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#F7F4EE',
    },
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-sharing',
    'expo-web-browser',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#7C3AED',
      },
    ],
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription:
          'Dialed Self reads activity, sleep, and mindfulness metrics to score your health stack.',
        NSHealthUpdateUsageDescription:
          'Dialed Self can write wellness activity back to Health when you choose to sync.',
        background: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    aiEdgeFunctionUrl: process.env.EXPO_PUBLIC_AI_EDGE_FUNCTION_URL,
    revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  },
};

export default config;
