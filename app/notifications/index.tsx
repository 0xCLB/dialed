import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/notificationService';
import type { InAppNotification } from '@/features/notifications/types';
import { track } from '@/lib/analytics';

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function NotificationsScreen() {
  const { session } = useRequireSession();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  const load = useCallback(async (asRefresh = false) => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      setNotifications(await getNotifications(session.user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Notifications failed to load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleOpen(notification: InAppNotification) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
      track('notification_marked_read', { type: notification.type });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
    }

    track('notification_opened', { type: notification.type, route: notification.deepLink.route });
    router.push(notification.deepLink.route as never);
  }

  async function handleMarkAllRead() {
    if (!session?.user.id) return;
    await markAllNotificationsRead(session.user.id);
    track('notification_marked_read', { type: 'all' });
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.title}>
          <Text variant="title">Notifications</Text>
          <Text variant="caption" muted>
            {unreadCount ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <Button
          variant="secondary"
          style={styles.iconButton}
          disabled={unreadCount === 0}
          onPress={handleMarkAllRead}>
          <CheckCheck size={18} color={theme.colors.ink} />
        </Button>
      </View>

      {loading ? <LoadingState label="Loading notifications" /> : null}
      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {!loading && !error && notifications.length === 0 ? (
        <EmptyState
          title="Quiet right now"
          body="Friend proofs, leaderboard moves, streak saves, reactions, and digest drops appear here."
        />
      ) : null}

      {!loading && !error
        ? notifications.map((notification) => (
            <Pressable
              key={notification.id}
              accessibilityRole="button"
              onPress={() => handleOpen(notification)}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card style={!notification.readAt ? styles.unreadCard : styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.bell, !notification.readAt && styles.bellUnread]}>
                    <Bell
                      size={17}
                      color={!notification.readAt ? theme.colors.white : theme.colors.primary}
                    />
                  </View>
                  <View style={styles.cardCopy}>
                    <View style={styles.cardTitleRow}>
                      <Text variant="subtitle" style={styles.cardTitle}>
                        {notification.title}
                      </Text>
                      <Text variant="caption" muted>
                        {relativeTime(notification.createdAt)}
                      </Text>
                    </View>
                    <Text muted>{notification.body}</Text>
                  </View>
                </View>
                {!notification.readAt ? <View style={styles.unreadDot} /> : null}
              </Card>
            </Pressable>
          ))
        : null}
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
  title: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  card: {
    gap: 10,
  },
  unreadCard: {
    gap: 10,
    borderColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  bellUnread: {
    backgroundColor: theme.colors.primary,
  },
  cardCopy: {
    flex: 1,
    gap: 5,
  },
  cardTitleRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
});
