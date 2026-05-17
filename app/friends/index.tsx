import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, UserPlus } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { listFriendships, requestFriend, searchProfiles } from '@/features/social/social-service';

export default function FriendsScreen() {
  useRequireSession();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [query, setQuery] = useState('');
  const [friendships, setFriendships] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setFriendships(await listFriendships(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Friends failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchProfiles(query).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleAdd(addresseeId: string) {
    if (!userId) {
      return;
    }
    await requestFriend(addresseeId, userId);
    await load();
    setQuery('');
    setResults([]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="title">Friends</Text>
      </View>

      <TextInputField
        label="Find friends"
        value={query}
        onChangeText={setQuery}
        placeholder="Search username or name"
        autoCapitalize="none"
      />

      {results.length > 0 ? (
        <Card style={styles.card}>
          {results.map((profile) => (
            <View key={profile.id} style={styles.row}>
              <View style={styles.copy}>
                <Text>{profile.display_name ?? profile.username}</Text>
                <Text variant="caption" muted>
                  @{profile.username}
                </Text>
              </View>
              <Button variant="secondary" style={styles.iconButton} onPress={() => handleAdd(profile.id)}>
                <UserPlus size={18} color={theme.colors.ink} />
              </Button>
            </View>
          ))}
        </Card>
      ) : null}

      <Text variant="subtitle">Your circle</Text>
      {loading ? <LoadingState label="Loading friends" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && friendships.length === 0 ? (
        <EmptyState title="No friends yet" body="Search for a username to start competing." />
      ) : null}
      {friendships.map((friendship) => {
        const other =
          friendship.requester_id === userId ? friendship.addressee : friendship.requester;
        return (
          <Pressable key={friendship.id} onPress={() => router.push(`/friends/${other?.id}`)}>
            <Card style={styles.row}>
              <View style={styles.copy}>
                <Text>{other?.display_name ?? other?.username ?? 'Dialed athlete'}</Text>
                <Text variant="caption" muted>
                  {friendship.status}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
});
