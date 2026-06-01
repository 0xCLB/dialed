import { Pressable, StyleSheet, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

function packageLabel(pkg: PurchasesPackage) {
  if (pkg.packageType === 'ANNUAL') return 'Annual';
  if (pkg.packageType === 'MONTHLY') return 'Monthly';
  if (pkg.packageType === 'WEEKLY') return 'Weekly';
  if (pkg.packageType === 'LIFETIME') return 'Lifetime';
  return pkg.product.title || pkg.identifier;
}

function packageDetail(pkg: PurchasesPackage) {
  if (pkg.packageType === 'ANNUAL' && pkg.product.pricePerMonthString) {
    return `${pkg.product.pricePerMonthString}/mo billed yearly`;
  }
  if (pkg.packageType === 'MONTHLY') return 'Flexible monthly access';
  return pkg.product.description || 'Dialed Pro access';
}

export function PackageCard({
  pkg,
  selected,
  onPress,
}: {
  pkg: PurchasesPackage;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text variant="subtitle">{packageLabel(pkg)}</Text>
          {pkg.packageType === 'ANNUAL' ? (
            <View style={styles.saveBadge}>
              <Crown size={12} color={theme.colors.primary} />
              <Text variant="caption" style={styles.saveText}>
                Best value
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" muted>
          {packageDetail(pkg)}
        </Text>
      </View>
      <Text variant="subtitle" style={styles.price}>
        {pkg.product.priceString}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.78,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  saveBadge: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveText: {
    color: theme.colors.primary,
  },
  price: {
    color: theme.colors.ink,
  },
});
