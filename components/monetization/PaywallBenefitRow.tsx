import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function PaywallBenefitRow({
  title,
  body,
  icon,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon ?? <CheckCircle2 size={18} color={theme.colors.primary} />}</View>
      <View style={styles.copy}>
        <Text>{title}</Text>
        {body ? (
          <Text variant="caption" muted>
            {body}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 26,
    alignItems: 'center',
    paddingTop: 2,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
});
