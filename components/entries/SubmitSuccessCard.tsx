import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckCircle2, Clock3, ShieldCheck, Sparkles, Ticket } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PointsBadge } from '@/components/entries/PointsBadge';
import { ShareCTAButton } from '@/components/sharing/ShareCTAButton';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { buildEntryShareData } from '@/features/sharing/shareDataService';
import { getEntryProofType, isManualNote } from '@/features/entries/proofPolicy';
import { isFoodProof } from '@/features/food/foodAnalysisService';
import { getEntryDisplayScore } from '@/features/scoring/basicScoring';
import type { EntryWithScore } from '@/features/entries/types';
import type { ProofWallet } from '@/features/proofs/types';
import type { ShareCardData } from '@/features/sharing/types';
import { PILLARS } from '@/lib/constants';

function sourceLabel(entry: EntryWithScore) {
  if (isManualNote(entry)) return 'Manual Note';
  if (isFoodProof(entry)) return 'Food Proof';
  const proofType = getEntryProofType(entry);
  if (proofType === 'health') return 'Verified by Health';
  if (proofType === 'location') return 'Location Proof';
  if (proofType === 'hybrid') return 'Hybrid Proof';
  return 'Photo Proof';
}

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
  const manualNote = isManualNote(entry);
  const displayScore = getEntryDisplayScore(entry);
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
        <View style={[styles.icon, scored || manualNote ? styles.scoredIcon : styles.pendingIcon]}>
          {scored || manualNote ? (
            <CheckCircle2 size={28} color={theme.colors.success} />
          ) : (
            <Clock3 size={28} color={theme.colors.warning} />
          )}
        </View>
        <View style={styles.copy}>
          <Text variant="title">
            {manualNote ? 'Manual note saved' : scored ? 'Proof logged' : 'Proof saved'}
          </Text>
          <Text muted style={styles.centerText}>
            {manualNote
              ? 'Timeline context saved. Verified proofs move ranked score.'
              : scored
              ? entry.score?.aiSubtext ?? 'That one counted. Your day just got louder.'
              : 'Basic score is live. Proof Analysis can refine it later. Proof > promises.'}
          </Text>
        </View>
        {manualNote ? (
          <Text variant="caption" style={styles.contextBadge}>
            Context only
          </Text>
        ) : (
          <PointsBadge
            points={displayScore.points}
            pending={displayScore.pending}
            basic={displayScore.basic}
          />
        )}
        <View style={styles.rewardGrid}>
          <View style={styles.rewardTile}>
            <ShieldCheck size={17} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Source
            </Text>
            <Text variant="subtitle" style={styles.rewardValue}>
              {sourceLabel(entry)}
            </Text>
          </View>
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
              {manualNote ? 'Not spent' : '-1 spent'}
            </Text>
          </View>
          <View style={styles.rewardTile}>
            <Ticket size={17} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Confidence
            </Text>
            <Text variant="subtitle" style={styles.rewardValue}>
              {entry.score?.confidence
                ? `${Math.round(entry.score.confidence * 100)}%`
                : displayScore.basic
                  ? 'Basic'
                  : '-'}
            </Text>
          </View>
        </View>
        {!manualNote ? (
          <Text variant="caption" muted style={styles.centerText}>
            Daily Proofs left: {proofWallet?.setupRequired ? 'setup needed' : proofWallet?.remainingProofs ?? '-'}
          </Text>
        ) : null}
        <Text variant="caption" muted style={styles.centerText}>
          {manualNote
            ? 'Manual notes help recap and memory, not ranked score.'
            : scored
            ? 'Score moved. One proof can move you up.'
            : displayScore.detail}
        </Text>
        <View style={styles.actions}>
          {!manualNote ? <ShareCTAButton label="Share this proof" onPress={handleShare} /> : null}
          <Button onPress={onViewDay} style={styles.actionButton}>
            View My Day
          </Button>
          <Button variant="secondary" onPress={onAddAnother} style={styles.actionButton}>
            Log another
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
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardTile: {
    flexBasis: '47%',
    flexGrow: 1,
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
  contextBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: 'hidden',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primarySoft,
  },
  actionButton: {
    width: '100%',
  },
});
