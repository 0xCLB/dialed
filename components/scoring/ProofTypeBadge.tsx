import { StyleSheet, View } from 'react-native';
import { Camera, FileText, HeartPulse, MapPin, ShieldCheck, Utensils } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ProofType } from '@/features/scoring/types';

const LABELS: Record<ProofType, string> = {
  photo: 'Photo classified',
  food_photo: 'Food Proof',
  location: 'Location Proof',
  health: 'Verified by Health',
  hybrid: 'Hybrid Proof',
  manual_note: 'Manual note',
};

function Icon({ proofType }: { proofType: ProofType }) {
  const color = proofType === 'manual_note' ? theme.colors.muted : theme.colors.primary;
  if (proofType === 'food_photo') return <Utensils size={14} color={color} />;
  if (proofType === 'location') return <MapPin size={14} color={color} />;
  if (proofType === 'health') return <HeartPulse size={14} color={color} />;
  if (proofType === 'hybrid') return <ShieldCheck size={14} color={color} />;
  if (proofType === 'manual_note') return <FileText size={14} color={color} />;
  return <Camera size={14} color={color} />;
}

export function ProofTypeBadge({ proofType }: { proofType: ProofType }) {
  const manual = proofType === 'manual_note';
  return (
    <View style={[styles.badge, manual && styles.manual]}>
      <Icon proofType={proofType} />
      <Text variant="caption" style={manual ? styles.manualText : styles.text}>
        {LABELS[proofType]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
  },
  manual: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  text: {
    color: theme.colors.primaryDark,
  },
  manualText: {
    color: theme.colors.muted,
  },
});
