import { Children, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: ButtonProps) {
  const labelStyle = [
    styles.label,
    variant === 'primary' && styles.primaryLabel,
    variant === 'danger' && styles.dangerLabel,
  ];

  function renderChild(child: ReactNode) {
    if (typeof child === 'string' || typeof child === 'number') {
      const text = String(child).trim();
      return text ? (
        <Text key={text} variant="body" style={labelStyle}>
          {text}
        </Text>
      ) : null;
    }
    return child;
  }

  function renderContent() {
    const childArray = Children.toArray(children);
    if (
      childArray.length === 1 &&
      (typeof childArray[0] === 'string' || typeof childArray[0] === 'number')
    ) {
      return (
        <Text variant="body" style={labelStyle}>
          {childArray[0]}
        </Text>
      );
    }

    if (childArray.length === 1) {
      return childArray[0];
    }

    return <View style={styles.contentRow}>{childArray.map(renderChild)}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || disabled) && styles.dimmed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.white : theme.colors.ink} />
      ) : renderContent()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.dangerSoft,
  },
  dimmed: {
    opacity: 0.55,
  },
  label: {
    fontWeight: '800',
    textAlign: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: {
    color: theme.colors.white,
  },
  dangerLabel: {
    color: theme.colors.danger,
  },
});
