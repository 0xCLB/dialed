import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Camera, CheckCircle2 } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PillarChip } from '@/components/entries/PillarChip';
import { PointsBadge } from '@/components/entries/PointsBadge';
import {
  entryProofLabel,
  getEntryProofType,
  getEntryTrustWeight,
  isManualNote,
  verificationMethodLabel,
  getEntryVerificationMethod,
} from '@/features/entries/proofPolicy';
import { isFoodProof } from '@/features/food/foodAnalysisService';
import { getEntryDisplayScore } from '@/features/scoring/basicScoring';
import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';

function fallbackPillar(entry: EntryWithScore): WellnessPillar {
  return entry.score?.wellnessPillar ?? entry.wellnessPillar ?? 'mind';
}

function entryTitle(entry: EntryWithScore) {
  return entry.activityTag
    ? entry.activityTag.replace(/[_-]+/g, ' ')
    : entryProofLabel(entry);
}

function proofStatusLabel({
  manualNote,
  foodProof,
  proofType,
  scored,
}: {
  manualNote: boolean;
  foodProof: boolean;
  proofType: ReturnType<typeof getEntryProofType>;
  scored: boolean;
}) {
  if (manualNote) return 'Manual Note';
  if (foodProof) return 'Food Proof';
  if (proofType === 'health') return 'Verified by Health';
  if (scored) return 'Verified Proof';
  return 'Pending Verification';
}

export function EntryCard({ entry }: { entry: EntryWithScore }) {
  const photo = entry.media.find((item) => item.mediaKind === 'proof')?.signedUrl;
  const displayScore = getEntryDisplayScore(entry);
  const scored = displayScore.official;
  const manualNote = isManualNote(entry);
  const method = getEntryVerificationMethod(entry);
  const proofType = getEntryProofType(entry);
  const foodProof = isFoodProof(entry);
  const statusLabel = proofStatusLabel({ manualNote, foodProof, proofType, scored });

  return (
    <Pressable onPress={() => router.push(`/entry/${entry.id}`)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <PillarChip pillar={fallbackPillar(entry)} />
          <Text variant="caption" muted>
            {formatDistanceToNow(new Date(entry.occurredAt), { addSuffix: true })}
          </Text>
        </View>

        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} />
        ) : entry.entryType === 'photo' ? (
          <View style={styles.pendingImage}>
            <Camera size={24} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Photo processing
            </Text>
          </View>
        ) : null}

        <View style={styles.copy}>
          <View style={styles.badgeRow}>
            <Text variant="caption" style={[styles.proofBadge, manualNote && styles.noteBadge]}>
              {statusLabel}
            </Text>
            <Text variant="caption" muted>
              {verificationMethodLabel(method)} · {Math.round(getEntryTrustWeight(entry) * 100)}% trust
            </Text>
          </View>
          <Text variant="subtitle" style={styles.title}>
            {entryTitle(entry)}
          </Text>
          {entry.caption ? (
            <Text muted numberOfLines={2}>
              {entry.caption}
            </Text>
          ) : null}
          {entry.score?.aiSubtext ? (
            <Text muted numberOfLines={2}>
              {entry.score.aiSubtext}
            </Text>
          ) : !manualNote ? (
            <Text muted numberOfLines={2}>
              {displayScore.detail}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
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
          <View style={styles.status}>
            <CheckCircle2
              size={15}
              color={scored || manualNote ? theme.colors.success : theme.colors.warning}
            />
            <Text variant="caption" muted>
              {displayScore.rankedEligible ? 'Ranked eligible' : 'Not ranked'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  image: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  pendingImage: {
    minHeight: 132,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primarySoft,
  },
  copy: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  proofBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: 'hidden',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primarySoft,
  },
  noteBadge: {
    color: theme.colors.muted,
    backgroundColor: theme.colors.surfaceAlt,
  },
  contextBadge: {
    minHeight: 30,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    overflow: 'hidden',
    color: theme.colors.muted,
    backgroundColor: theme.colors.surfaceAlt,
  },
  title: {
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  status: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
