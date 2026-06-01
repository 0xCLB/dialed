import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Trophy } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { FriendListItem } from '@/components/social/FriendListItem';
import { FriendRequestCard } from '@/components/social/FriendRequestCard';
import { FriendSearchResult } from '@/components/social/FriendSearchResult';
import { useRequireSession } from '@/features/auth/useRequireSession';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendships,
  searchProfiles,
  sendFriendRequest,
} from '@/features/social/socialService';
import type { FriendRequest, Friendship, ProfileSummary } from '@/features/social/types';

export default function FriendsScreen() {
  const { session } = useRequireSession();
  const userId = session?.user.id;
  const [query, setQuery] = useState('');
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [results, setResults] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setFriendships(await getFriendships(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Friends failed to load.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        setResults(await searchProfiles(query));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const incoming = useMemo(
    () =>
      friendships.filter(
        (item): item is FriendRequest =>
          item.status === 'pending' && item.direction === 'incoming',
      ),
    [friendships],
  );
  const outgoing = useMemo(
    () =>
      friendships.filter(
        (item): item is FriendRequest =>
          item.status === 'pending' && item.direction === 'outgoing',
      ),
    [friendships],
  );
  const friends = useMemo(
    () => friendships.filter((item) => item.status === 'accepted'),
    [friendships],
  );
  const connectedIds = useMemo(
    () => new Set(friendships.map((item) => item.otherProfile?.id).filter(Boolean)),
    [friendships],
  );

  async function handleAdd(profile: ProfileSummary) {
    setMutatingId(profile.id);
    try {
      await sendFriendRequest(profile.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setQuery('');
      setResults([]);
      await load();
    } catch (mutationError) {
      Alert.alert(
        'Request failed',
        mutationError instanceof Error ? mutationError.message : 'Friend request could not be sent.',
      );
    } finally {
      setMutatingId(null);
    }
  }

  async function handleAccept(friendshipId: string) {
    setMutatingId(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDecline(friendshipId: string) {
    setMutatingId(friendshipId);
    try {
      await declineFriendRequest(friendshipId);
      await load();
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={load}>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.title}>
          <Text variant="title">Friends</Text>
          <Text muted>Find your circle and make the leaderboard matter.</Text>
        </View>
      </View>

      <TextInputField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Username or display name"
        autoCapitalize="none"
      />

      {searching ? <LoadingState label="Searching" /> : null}
      {results.length > 0 ? (
        <Card style={styles.card}>
          {results.map((profile) => (
            <FriendSearchResult
              key={profile.id}
              profile={profile}
              disabled={connectedIds.has(profile.id) || mutatingId === profile.id}
              onAdd={() => handleAdd(profile)}
            />
          ))}
        </Card>
      ) : null}

      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!error && loading ? <LoadingState label="Loading friends" /> : null}

      {!loading && !error ? (
        <>
          {incoming.length > 0 ? (
            <View style={styles.section}>
              <Text variant="subtitle">Incoming Requests</Text>
              {incoming.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  kind="incoming"
                  onAccept={() => handleAccept(request.id)}
                  onDecline={() => handleDecline(request.id)}
                />
              ))}
            </View>
          ) : null}

          {outgoing.length > 0 ? (
            <View style={styles.section}>
              <Text variant="subtitle">Outgoing Requests</Text>
              {outgoing.map((request) => (
                <FriendRequestCard key={request.id} request={request} kind="outgoing" />
              ))}
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Your Circle</Text>
            <Button variant="secondary" style={styles.leaderboardButton} onPress={() => router.push('/(tabs)/leaderboard')}>
              <Trophy size={17} color={theme.colors.ink} />
            </Button>
          </View>

          {friends.length === 0 ? (
            <EmptyState title="No friends yet" body="Search for a username to start competing." />
          ) : (
            friends.map((friendship) => (
              <FriendListItem
                key={friendship.id}
                friendship={friendship}
                onPress={() => router.push(`/friends/${friendship.otherProfile?.id}`)}
              />
            ))
          )}
        </>
      ) : null}
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
    gap: 3,
  },
  card: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leaderboardButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
});
