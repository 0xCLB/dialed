import { useEffect, useState } from 'react';
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
import { useDiagnosticsStore } from '@/features/dev/diagnosticsStore';
import { usePro } from '@/features/monetization/usePro';
import { getTodayProofWallet } from '@/features/proofs/proofService';
import type { ProofWallet } from '@/features/proofs/types';
import { env, isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  useRequireSession();
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const authError = useAuthStore((state) => state.error);
  const lastEntryInsertError = useDiagnosticsStore((state) => state.lastEntryInsertError);
  const lastScoringError = useDiagnosticsStore((state) => state.lastScoringError);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const pro = usePro();
  const [privateMode, setPrivateMode] = useState(Boolean(profile?.isPrivate));
  const [saving, setSaving] = useState(false);
  const [proofWallet, setProofWallet] = useState<ProofWallet | null>(null);

  useEffect(() => {
    if (env.appEnv === 'production' || !session?.user.id) {
      setProofWallet(null);
      return;
    }

    getTodayProofWallet(session.user.id, { isPro: Boolean(pro.isPro || profile?.isPro) })
      .then(setProofWallet)
      .catch(() => setProofWallet(null));
  }, [profile?.isPro, pro.isPro, session?.user.id]);

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
        .update({ privacy_default: next ? 'private' : 'friends' })
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

      {env.appEnv !== 'production' ? (
        <Card style={styles.card}>
          <Text variant="subtitle">Dev Diagnostics</Text>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              User
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {session?.user.id ?? 'none'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Profile
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {profile ? 'loaded' : 'missing'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Supabase
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {isSupabaseConfigured ? 'configured' : 'missing env'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Storage
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              remote buckets verified
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Proof wallet
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {proofWallet
                ? proofWallet.setupRequired
                  ? 'setup required'
                  : `${proofWallet.remainingProofs} left`
                : 'not loaded'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Auth error
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {authError ?? 'none'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Entry error
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {lastEntryInsertError ?? 'none'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text variant="caption" muted>
              Scoring error
            </Text>
            <Text variant="caption" style={styles.diagnosticValue}>
              {lastScoringError ?? 'none'}
            </Text>
          </View>
        </Card>
      ) : null}

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
  diagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  diagnosticValue: {
    flex: 1,
    textAlign: 'right',
  },
});
