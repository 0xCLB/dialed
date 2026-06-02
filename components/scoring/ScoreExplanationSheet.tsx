import { View, StyleSheet } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { ProofTypeBadge } from '@/components/scoring/ProofTypeBadge';
import { TrustBadge } from '@/components/scoring/TrustBadge';
import type { ScoreResult } from '@/features/scoring/types';

export function ScoreExplanationSheet({
  visible,
  result,
  onClose,
}: {
  visible: boolean;
  result: ScoreResult | null;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {result ? (
        <>
          <Text variant="title">Proof Analysis</Text>
          <View style={styles.badges}>
            <ProofTypeBadge proofType={result.proofType} />
            <TrustBadge trustLevel={result.trustLevel} confidence={result.confidence} />
          </View>
          <View style={styles.scoreBox}>
            <Text variant="metric">+{result.points}</Text>
            <Text variant="caption" muted>
              Dialed Points
            </Text>
          </View>
          <Text>{result.explanation}</Text>
          <Text muted>
            Ranked score favors verified photo, location, health, and hybrid proofs. Manual notes
            help your timeline but do not move ranked score by default.
          </Text>
          <Button onPress={onClose}>Done</Button>
        </>
      ) : (
        <>
          <Text variant="title">Scoring pending</Text>
          <Text muted>Your proof is saved. Analysis can finish later.</Text>
          <Button onPress={onClose}>Done</Button>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBox: {
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 3,
    backgroundColor: theme.colors.primarySoft,
  },
});
