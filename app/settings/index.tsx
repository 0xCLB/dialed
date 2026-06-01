import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Crown, HeartPulse, Lock, LogOut } from 'lucide-react-native';

import { ProBadge } from '@/components/monetization/ProBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { signOut } from '@/features/auth/auth-service';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { usePro } from '@/features/monetization/usePro';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  useRequireSession();
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const pro = usePro();
  const [privateMode, setPrivateMode] = useState(Boolean(profile?.isPrivate));
  const [saving, setSaving] = useState(false);

  async function togglePrivate() {
    if (!profile) {
      return;
    }
    const next = !privateMode;
    setPrivateMode(next);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: next })
        .eq('id', profile.id);
      if (error) {
        throw error;
      }
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="title">Settings</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <Crown size={20} color={theme.colors.primary} />
          <View style={styles.copy}>
            <Text>Dialed Pro</Text>
            <Text variant="caption" muted>
              {pro.isPro || profile?.isPro
                ? 'Active entitlement detected.'
                : 'Premium insights, templates, reels, and challenge tools.'}
            </Text>
          </View>
          {pro.isPro || profile?.isPro ? <ProBadge compact /> : null}
        </View>
        <View style={styles.actionRow}>
          <Button style={styles.actionButton} onPress={() => pro.openPaywall('settings')}>
            {pro.isPro || profile?.isPro ? 'Manage Subscription' : 'Go Pro'}
          </Button>
          <Button
            variant="secondary"
            loading={pro.loading}
            style={styles.actionButton}
            onPress={() => pro.restore()}>
            Restore
          </Button>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Privacy</Text>
        <Pressable onPress={togglePrivate} disabled={saving} style={styles.settingRow}>
          <Lock size={20} color={theme.colors.ink} />
          <View style={styles.copy}>
            <Text>Private profile</Text>
            <Text variant="caption" muted>
              Only accepted friends can inspect your timeline.
            </Text>
          </View>
          <View style={[styles.toggle, privateMode && styles.toggleActive]}>
            <View style={[styles.knob, privateMode && styles.knobActive]} />
          </View>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Data sources</Text>
        <View style={styles.settingRow}>
          <HeartPulse size={20} color={theme.colors.accent} />
          <View style={styles.copy}>
            <Text>Apple HealthKit</Text>
            <Text variant="caption" muted>
              Authorized on-device; synced samples are stored under RLS.
            </Text>
          </View>
        </View>
        <Button variant="secondary" onPress={() => router.push('/settings/health')}>
          Manage health sources
        </Button>
        <View style={styles.settingRow}>
          <Bell size={20} color={theme.colors.accent} />
          <View style={styles.copy}>
            <Text>Push notifications</Text>
            <Text variant="caption" muted>
              Expo push tokens are stored per user for reset nudges and reactions.
            </Text>
          </View>
        </View>
        <Button variant="secondary" onPress={() => router.push('/settings/notifications')}>
          Manage smart alerts
        </Button>
      </Card>

      <Button variant="danger" onPress={handleSignOut}>
        <LogOut size={18} color={theme.colors.danger} /> Sign out
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  card: {
    gap: 14,
  },
  settingRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  copy: {
    flex: 1,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceAlt,
    padding: 3,
  },
  toggleActive: {
    backgroundColor: theme.colors.accent,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
  },
  knobActive: {
    transform: [{ translateX: 22 }],
  },
});
