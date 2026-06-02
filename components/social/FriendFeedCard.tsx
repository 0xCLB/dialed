import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PointsBadge } from '@/components/entries/PointsBadge';
import { ReactionBar } from '@/components/social/ReactionBar';
import { getEntryDisplayScore } from '@/features/scoring/basicScoring';
import type { FriendFeedItem, ReactionType } from '@/features/social/types';

function entryTitle(item: FriendFeedItem) {
  return item.entry.activityTag?.replace(/[_-]+/g, ' ') ?? 'Dialed proof';
}

export function FriendFeedCard({
  item,
  onReaction,
}: {
  item: FriendFeedItem;
  onReaction: (entryId: string, reaction: ReactionType, selected: boolean) => void;
}) {
  const photo = item.entry.media[0]?.signedUrl;
  const displayScore = getEntryDisplayScore(item.entry);

  return (
    <Card style={styles.card}>
      <Pressable style={styles.header} onPress={() => router.push(`/friends/${item.profile.id}`)}>
        <Avatar name={item.profile.displayName} uri={item.profile.avatarPath} size={42} />
        <View style={styles.copy}>
          <Text variant="subtitle" numberOfLines={1}>
            {item.profile.displayName}
          </Text>
          <Text variant="caption" muted>
            {formatDistanceToNow(new Date(item.entry.occurredAt), { addSuffix: true })}
          </Text>
        </View>
        <PointsBadge
          points={displayScore.points}
          pending={displayScore.pending}
          basic={displayScore.basic}
        />
      </Pressable>

      <Pressable onPress={() => router.push(`/entry/${item.entry.id}`)} style={styles.entry}>
        {photo ? <Image source={{ uri: photo }} style={styles.image} /> : null}
        <View style={styles.copy}>
          <Text variant="subtitle" style={styles.title}>
            {entryTitle(item)}
          </Text>
          {item.entry.caption ? (
            <Text muted numberOfLines={2}>
              {item.entry.caption}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <ReactionBar
        counts={item.reactionCounts}
        active={item.myReactions}
        onToggle={(reaction, selected) => onReaction(item.entry.id, reaction, selected)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entry: {
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  title: {
    textTransform: 'capitalize',
  },
});
