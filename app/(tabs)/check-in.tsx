import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Send } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { PillarChip } from '@/components/entries/PillarChip';
import { QuickPickGrid, type QuickPick } from '@/components/entries/QuickPickGrid';
import { SubmitSuccessCard } from '@/components/entries/SubmitSuccessCard';
import { VisibilitySelector } from '@/components/entries/VisibilitySelector';
import { DailyProofCard } from '@/components/proofs/DailyProofCard';
import { EarnMoreProofsCard } from '@/components/proofs/EarnMoreProofsCard';
import { ProofBalancePill } from '@/components/proofs/ProofBalancePill';
import { ProofSpendModal } from '@/components/proofs/ProofSpendModal';
import { ProProofUpgradeCard } from '@/components/proofs/ProProofUpgradeCard';
import { useAuth } from '@/features/auth/useAuth';
import { createManualEntry } from '@/features/entries/entryService';
import type {
  EntryVisibility,
  EntryWithScore,
  WellnessPillar,
} from '@/features/entries/types';
import { usePro } from '@/features/monetization/usePro';
import { canSpendProof, getTodayProofWallet } from '@/features/proofs/proofService';
import type { ProofWallet } from '@/features/proofs/types';
import { PILLAR_ORDER } from '@/lib/constants';

const QUICK_PICKS: QuickPick[] = [
  { key: 'gym', label: 'Gym', activityTag: 'gym', pillar: 'movement' },
  { key: 'walk', label: 'Walk', activityTag: 'walk', pillar: 'movement' },
  { key: 'water', label: 'Water', activityTag: 'water', pillar: 'fuel' },
  { key: 'protein', label: 'Protein', activityTag: 'protein', pillar: 'fuel' },
  { key: 'reading', label: 'Reading', activityTag: 'reading', pillar: 'mind' },
  { key: 'meditation', label: 'Meditation', activityTag: 'meditation', pillar: 'mind' },
  { key: 'sauna', label: 'Sauna', activityTag: 'sauna', pillar: 'recovery' },
  { key: 'stretch', label: 'Stretch', activityTag: 'stretch', pillar: 'recovery' },
];

function inferPillar(value: string): WellnessPillar {
  const text = value.toLowerCase();
  if (/(gym|walk|run|lift|workout|steps|sport|hike)/.test(text)) return 'movement';
  if (/(water|protein|meal|fuel|hydrate|nutrition|fast)/.test(text)) return 'fuel';
  if (/(read|meditat|journal|study|mind|focus|therapy)/.test(text)) return 'mind';
  if (/(sauna|stretch|sleep|mobility|cold|breath|recover)/.test(text)) return 'recovery';
  return 'mind';
}

export default function CheckInScreen() {
  const { session, profile } = useAuth();
  const pro = usePro();
  const [selectedPick, setSelectedPick] = useState<QuickPick | null>(QUICK_PICKS[0]);
  const [customActivity, setCustomActivity] = useState('');
  const [caption, setCaption] = useState('');
  const [pillar, setPillar] = useState<WellnessPillar>(QUICK_PICKS[0].pillar);
  const [visibility, setVisibility] = useState<EntryVisibility>(
    profile?.privacyDefault ?? 'friends',
  );
  const [proofWallet, setProofWallet] = useState<ProofWallet | null>(null);
  const [proofLoading, setProofLoading] = useState(true);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState<EntryWithScore | null>(null);
  const hasProAccess = Boolean(pro.isPro || profile?.isPro);

  const activityTag = useMemo(
    () => customActivity.trim() || selectedPick?.activityTag || '',
    [customActivity, selectedPick],
  );

  const refreshProofWallet = useCallback(async () => {
    if (!session?.user.id) {
      setProofWallet(null);
      setProofLoading(false);
      return null;
    }

    setProofLoading(true);
    try {
      const wallet = await getTodayProofWallet(session.user.id, { isPro: hasProAccess });
      setProofWallet(wallet);
      return wallet;
    } catch {
      return null;
    } finally {
      setProofLoading(false);
    }
  }, [hasProAccess, session?.user.id]);

  useEffect(() => {
    refreshProofWallet();
  }, [refreshProofWallet]);

  function handleQuickPick(pick: QuickPick) {
    Haptics.selectionAsync();
    setSelectedPick(pick);
    setCustomActivity('');
    setPillar(pick.pillar);
  }

  function handleCustomActivity(value: string) {
    setCustomActivity(value);
    setSelectedPick(null);
    if (value.trim()) {
      setPillar(inferPillar(value));
    }
  }

  async function handleUseProofPress() {
    if (!session?.user.id) {
      Alert.alert('Sign in required', 'Log in again before creating an entry.');
      return;
    }

    if (!activityTag.trim()) {
      Alert.alert('Add an activity', 'Pick a quick action or type one in.');
      return;
    }

    const proofCheck = await canSpendProof(session.user.id, { isPro: hasProAccess });
    setProofWallet(proofCheck.wallet);
    setProofModalVisible(true);
  }

  async function handleSubmit() {
    if (!session?.user.id) {
      Alert.alert('Sign in required', 'Log in again before creating an entry.');
      return;
    }

    setProofModalVisible(false);
    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const entry = await createManualEntry({
        userId: session.user.id,
        activityTag,
        caption,
        wellnessPillar: pillar,
        visibility,
      });
      setSubmittedEntry(entry);
      await refreshProofWallet();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await refreshProofWallet();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Check-in failed',
        error instanceof Error ? error.message : 'The entry could not be saved.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openEarnMore() {
    setProofModalVisible(false);
    router.push('/(tabs)/home');
  }

  function openUpgrade() {
    setProofModalVisible(false);
    pro.openPaywall('settings');
  }

  function resetForm() {
    setSubmittedEntry(null);
    setSelectedPick(QUICK_PICKS[0]);
    setCustomActivity('');
    setCaption('');
    setPillar(QUICK_PICKS[0].pillar);
  }

  if (submittedEntry) {
    return (
      <Screen>
        <ProofBalancePill wallet={proofWallet} loading={proofLoading} />
        <SubmitSuccessCard
          entry={submittedEntry}
          proofWallet={proofWallet}
          onViewDay={() => router.replace('/(tabs)/home')}
          onAddAnother={resetForm}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">Manual check-in</Text>
        <Text muted>Log the healthy thing while it is still fresh.</Text>
        <ProofBalancePill wallet={proofWallet} loading={proofLoading} />
      </View>

      <DailyProofCard
        wallet={proofWallet}
        loading={proofLoading}
        onEarnMore={openEarnMore}
        onUpgrade={openUpgrade}
      />

      <Card style={styles.card}>
        <Text variant="subtitle">Quick picks</Text>
        <QuickPickGrid
          picks={QUICK_PICKS}
          selectedKey={selectedPick?.key ?? null}
          onSelect={handleQuickPick}
        />
      </Card>

      <Card style={styles.card}>
        <TextInputField
          label="Activity"
          placeholder="Search or type your own"
          value={customActivity}
          onChangeText={handleCustomActivity}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <TextInputField
          label="Caption"
          placeholder="Tiny victory lap optional"
          value={caption}
          onChangeText={setCaption}
          multiline
          style={styles.captionInput}
        />
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Pillar</Text>
        <View style={styles.pillars}>
          {PILLAR_ORDER.map((item) => (
            <PillarChip
              key={item}
              pillar={item}
              selected={pillar === item}
              onPress={() => {
                Haptics.selectionAsync();
                setPillar(item);
              }}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Visibility</Text>
        <VisibilitySelector value={visibility} onChange={setVisibility} />
      </Card>

      {proofWallet?.remainingProofs === 0 || proofWallet?.setupRequired ? (
        <>
          <EarnMoreProofsCard onShare={openEarnMore} onInvite={() => router.push('/friends')} />
          {!hasProAccess ? <ProProofUpgradeCard onPress={openUpgrade} /> : null}
        </>
      ) : null}

      <Button loading={submitting} disabled={!activityTag.trim()} onPress={handleUseProofPress}>
        <Send size={18} color={theme.colors.white} />
        Use a Proof
      </Button>
      <ProofSpendModal
        visible={proofModalVisible}
        wallet={proofWallet}
        loading={submitting}
        onConfirm={handleSubmit}
        onClose={() => setProofModalVisible(false)}
        onEarnMore={openEarnMore}
        onUpgrade={openUpgrade}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  card: {
    gap: 14,
  },
  captionInput: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  pillars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
