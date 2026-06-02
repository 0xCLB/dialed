import { Redirect, Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Camera, CircleUserRound, Home, ListPlus, Trophy } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';

export default function TabLayout() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized || loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile || !profile.onboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.faint,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: 86,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarButton: (props: any) => {
          const { children, onPress, ref: _ref, ...buttonProps } = props;
          return (
            <Pressable
              {...buttonProps}
              onPress={(event) => {
                Haptics.selectionAsync();
                onPress?.(event);
              }}>
              {children}
            </Pressable>
          );
        },
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Log Proof',
          tabBarIcon: ({ color }) => <ListPlus size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Photo',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.captureButton, focused && styles.captureButtonFocused]}>
              <Camera size={28} color={theme.colors.white} />
            </View>
          ),
          tabBarItemStyle: styles.captureItem,
          tabBarLabelStyle: styles.captureLabel,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <Trophy size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <CircleUserRound size={23} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  captureItem: {
    transform: [{ translateY: -16 }],
  },
  captureButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 8,
  },
  captureButtonFocused: {
    backgroundColor: theme.colors.primaryDark,
  },
  captureLabel: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
