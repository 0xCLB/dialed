import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { getNotifications, readNotification } from '@/features/notifications/notification-service';
import type { AppNotification } from '@/types/domain';

export default function NotificationsScreen() {
  useRequireSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await getNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Notifications failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRead(id: string) {
    await readNotification(id);
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="title">Notifications</Text>
      </View>
      {loading ? <LoadingState label="Loading notifications" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && notifications.length === 0 ? (
        <EmptyState title="Quiet right now" body="Reactions, friend requests, resets, and digests appear here." />
      ) : null}
      {notifications.map((notification) => (
        <Card key={notification.id} style={styles.card}>
          <Text variant="subtitle">{notification.title}</Text>
          <Text muted>{notification.body}</Text>
          {!notification.readAt ? (
            <Button variant="secondary" onPress={() => handleRead(notification.id)}>
              Mark read
            </Button>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  card: {
    gap: 10,
  },
});
