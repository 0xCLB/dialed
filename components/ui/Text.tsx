import { ReactNode } from 'react';
import { StyleSheet, Text as RNText, TextProps as RNTextProps } from 'react-native';

import { theme } from '@/components/ui/theme';

type TextProps = RNTextProps & {
  children: ReactNode;
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'metric';
  muted?: boolean;
};

export function Text({ children, variant = 'body', muted, style, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      style={[styles.base, styles[variant], muted && styles.muted, style]}
      maxFontSizeMultiplier={1.15}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.ink,
    fontWeight: '500',
    letterSpacing: 0,
  },
  hero: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  metric: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  muted: {
    color: theme.colors.muted,
  },
});
