import type { EntryWithScore } from '@/features/entries/types';
import type { DaySummary, PillarProgress, Streak } from '@/features/progress/types';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type ReactionType = 'fire' | 'dialed' | 'respect' | 'slippin' | 'water' | 'check';

export type ProfileSummary = {
  id: string;
  username: string | null;
  displayName: string;
  avatarPath: string | null;
  bio: string | null;
  city: string | null;
  privacyDefault: 'private' | 'friends' | 'public';
  isPro: boolean;
};

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  requester: ProfileSummary | null;
  addressee: ProfileSummary | null;
  otherProfile: ProfileSummary | null;
  direction: 'incoming' | 'outgoing';
};

export type FriendRequest = Friendship & {
  status: 'pending';
};

export type FriendFeedItem = {
  id: string;
  profile: ProfileSummary;
  entry: EntryWithScore;
  reactionCounts: Partial<Record<ReactionType, number>>;
  myReactions: ReactionType[];
};

export type FriendProfile = {
  profile: ProfileSummary;
  friendship: Friendship | null;
  todaySummary: DaySummary;
  streak: Streak | null;
  recentEntries: EntryWithScore[];
  pillarProgress: PillarProgress[];
};
