import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckCircle2, Clock3, Sparkles, Ticket } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PointsBadge } from '@/components/entries/PointsBadge';
import { ShareCTAButton } from '@/components/sharing/ShareCTAButton';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { buildEntryShareData } from '@/features/sharing/shareDataService';
import type { EntryWithScore } from '@/features/entries/types';
import type { ProofWallet } from '@/features/proofs/types';
import type { ShareCardData } from '@/features/sharing/types';
import { PILLARS } from '@/lib/constants';

export function SubmitSuccessCard({
  entry,
  proofWallet,
  onViewDay,
  onAddAnother,
}: {
  entry: EntryWithScore;
  proofWallet?: ProofWallet | null;
  onViewDay: () => void;
  onAddAnother: () => void;
}) {
  const scored = Boolean(entry.score);
  const pillar = entry.score?.wellnessPillar ?? entry.wellnessPillar;
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  async function handleShare() {
    setShareData(await buildEntryShareData(entry.id));
    setShareVisible(true);
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.icon, scored ? styles.scoredIcon : styles.pendingIcon]}>
          {scored ? (
            <CheckCircle2 size={28} color={theme.colors.success} />
          ) : (
            <Clock3 size={28} color={theme.colors.warning} />
          )}
        </View>
        <View style={styles.copy}>
          <Text variant="title">{scored ? 'Proof logged' : 'Proof saved'}</Text>
          <Text muted style={styles.centerText}>
            {scored
              ? entry.score?.aiSubtext ?? 'That one counted. Your day just got louder.'
              : 'Scoring is warming up. Your entry is safely pending. Proof > promises.'}
          </Text>
        </View>
        <PointsBadge points={entry.score?.points} pending={!scored} />
        <View style={styles.rewardGrid}>
          <View style={styles.rewardTile}>
            <Sparkles size={17} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Pillar
            </Text>
            <Text variant="subtitle" style={styles.rewardValue}>
              {pillar ? PILLARS[pillar].label : 'Pending'}
            </Text>
          </View>
          <View style={styles.rewardTile}>
            <Ticket size={17} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Daily Proof
            </Text>
            <Text variant="subtitle" style={styles.rewardValue}>
              -1 spent
            </Text>
          </View>
          <View style={styles.rewardTile}>
            <Ticket size={17} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Remaining
            </Text>
            <Text variant="subtitle" style={styles.rewardValue}>
              {proofWallet?.setupRequired ? 'Setup' : proofWallet?.remainingProofs ?? '-'}
            </Text>
          </View>
        </View>
        <Text variant="caption" muted style={styles.centerText}>
          {scored
            ? 'Score moved. One proof can move you up.'
            : 'Score movement posts when the scoring function lands.'}
        </Text>
        <View style={styles.actions}>
          <ShareCTAButton label="Share this proof" onPress={handleShare} />
          <Button onPress={onViewDay} style={styles.actionButton}>
            View My Day
          </Button>
          <Button variant="secondary" onPress={onAddAnother} style={styles.actionButton}>
            Later
          </Button>
        </View>
      </Card>
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        onClose={() => setShareVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoredIcon: {
    backgroundColor: theme.colors.successSoft,
  },
  pendingIcon: {
    backgroundColor: theme.colors.warningSoft,
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  centerText: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  rewardGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  rewardTile: {
    flex: 1,
    minHeight: 92,
    borderRadius: theme.radius.md,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.colors.primarySoft,
  },
  rewardValue: {
    color: theme.colors.primaryDark,
  },
  actionButton: {
    width: '100%',
  },
});
