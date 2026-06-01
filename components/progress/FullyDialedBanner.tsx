import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function FullyDialedBanner({ visible }: { visible: boolean }) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const celebrated = useRef(false);

  useEffect(() => {
    if (!visible) {
      celebrated.current = false;
      opacity.setValue(0);
      scale.setValue(0.96);
      return;
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    if (!celebrated.current) {
      celebrated.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ scale }] }]}>
      <View style={styles.icon}>
        <Sparkles size={22} color={theme.colors.white} />
      </View>
      <View style={styles.copy}>
        <Text variant="subtitle" style={styles.title}>
          Fully Dialed Day
        </Text>
        <Text style={styles.body}>Movement, Fuel, Mind, and Recovery are all on the board.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 92,
    borderRadius: theme.radius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.ink,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: theme.colors.white,
  },
  body: {
    color: theme.colors.surface,
  },
});
