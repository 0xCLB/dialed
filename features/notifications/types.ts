export type NotificationType =
  | 'friend_request'
  | 'reaction'
  | 'comment'
  | 'leaderboard'
  | 'challenge'
  | 'digest'
  | 'streak'
  | 'friend_entry'
  | 'system';

export type NotificationPreference = {
  userId: string;
  friendActivity: boolean;
  leaderboardMovement: boolean;
  streakRisk: boolean;
  digestReady: boolean;
  challengeUpdates: boolean;
  marketingUpdates: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  updatedAt?: string | null;
};

export type NotificationDevice = {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: 'ios' | 'android';
  deviceName: string | null;
  enabled: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationDeepLink = {
  route:
    | '/notifications'
    | '/friends'
    | '/(tabs)/leaderboard'
    | '/(tabs)/home'
    | `/entry/${string}`
    | `/friends/${string}`
    | `/timeline/${string}`
    | `/digest/${string}`;
  params?: Record<string, string>;
};

export type InAppNotification = {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  deepLink: NotificationDeepLink;
};

export type SmartNotificationCandidate = {
  type: NotificationType;
  userId: string;
  actorId?: string | null;
  actorName?: string | null;
  entryId?: string | null;
  friendId?: string | null;
  date?: string | null;
  activityTag?: string | null;
  pillar?: 'movement' | 'fuel' | 'mind' | 'recovery' | null;
  points?: number | null;
  rankDelta?: number | null;
  pointsBehindOrAhead?: number | null;
  closeFriend?: boolean;
  earlyMorning?: boolean;
  allPillarsCompleted?: boolean;
  notificationsSentToday?: number;
  canViewEntry?: boolean;
  metadata?: Record<string, unknown>;
};
