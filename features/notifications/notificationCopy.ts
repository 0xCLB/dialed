import { PILLARS } from '@/lib/constants';
import type { SmartNotificationCandidate } from '@/features/notifications/types';

function name(candidate: SmartNotificationCandidate) {
  return candidate.actorName?.trim() || 'A friend';
}

function activity(candidate: SmartNotificationCandidate) {
  return candidate.activityTag?.replace(/[_-]+/g, ' ') ?? 'proof';
}

export function friendEntryCopy(candidate: SmartNotificationCandidate) {
  const actor = name(candidate);
  const pillar = candidate.pillar ? PILLARS[candidate.pillar].label : 'wellness';
  const choices = [
    `${actor} logged ${activity(candidate)}. The scoreboard noticed.`,
    `${actor} just posted ${pillar} proof. Your move.`,
    `${actor} posted proof. Quietly hostile productivity.`,
  ];

  if (candidate.activityTag?.toLowerCase().includes('water')) {
    return `${actor} logged water. Hydration demon behavior.`;
  }

  if (candidate.activityTag?.toLowerCase().includes('gym')) {
    return `${actor} posted gym proof. The leaderboard noticed.`;
  }

  return choices[Math.abs((candidate.entryId ?? actor).length) % choices.length];
}

export function leaderboardCopy(candidate: SmartNotificationCandidate) {
  if (candidate.pointsBehindOrAhead && candidate.pointsBehindOrAhead > 0) {
    return `${name(candidate)} passed you by ${candidate.pointsBehindOrAhead} points.`;
  }

  if (candidate.rankDelta && candidate.rankDelta > 0) {
    return `You moved up ${candidate.rankDelta} spots. Keep the proof coming.`;
  }

  if (candidate.pillar) {
    return `${PILLARS[candidate.pillar].label} could put you ahead today.`;
  }

  return "You're one verified proof from top 3.";
}

export function streakCopy(candidate: SmartNotificationCandidate) {
  if (candidate.allPillarsCompleted) {
    return "You're close to a Fully Dialed Day.";
  }

  if (candidate.pillar) {
    return `One ${PILLARS[candidate.pillar].label} proof keeps the streak alive.`;
  }

  return 'One pillar keeps your streak alive.';
}

export function digestCopy() {
  return Math.random() > 0.5
    ? 'Your day has been judged. Fairly. Mostly.'
    : "Today's Dialed recap is ready.";
}

export function reactionCopy(candidate: SmartNotificationCandidate) {
  return `${name(candidate)} reacted to your proof. Social accountability, but make it charming.`;
}

export function friendRequestCopy(candidate: SmartNotificationCandidate) {
  return `${name(candidate)} wants to compete. Accept only if you're emotionally ready.`;
}

export function buildNotificationCopy(candidate: SmartNotificationCandidate) {
  if (candidate.type === 'friend_entry') {
    return { title: 'Friend proof logged', body: friendEntryCopy(candidate) };
  }
  if (candidate.type === 'leaderboard') {
    return { title: 'Leaderboard moved', body: leaderboardCopy(candidate) };
  }
  if (candidate.type === 'streak') {
    return { title: 'Streak watch', body: streakCopy(candidate) };
  }
  if (candidate.type === 'digest') {
    return { title: 'Daily Recap', body: digestCopy() };
  }
  if (candidate.type === 'reaction') {
    return { title: 'New reaction', body: reactionCopy(candidate) };
  }
  if (candidate.type === 'friend_request') {
    return { title: 'Friend request', body: friendRequestCopy(candidate) };
  }

  return {
    title: 'Dialed Self',
    body: 'A new Dialed update is ready.',
  };
}

export function calculateNotificationInterest(candidate: SmartNotificationCandidate) {
  let score = 20;

  if (candidate.closeFriend) score += 30;
  if ((candidate.points ?? 0) >= 25) score += 20;
  if (candidate.earlyMorning) score += 10;
  if (candidate.pointsBehindOrAhead && candidate.pointsBehindOrAhead > 0) score += 40;
  if (candidate.allPillarsCompleted) score += 30;
  if ((candidate.notificationsSentToday ?? 0) >= 4) score -= 50;

  if (candidate.type === 'friend_request') score += 45;
  if (candidate.type === 'reaction') score += 25;
  if (candidate.type === 'digest') score += 18;
  if (candidate.type === 'streak') score += 35;

  return Math.max(0, Math.min(100, score));
}

export function shouldSendSmartNotification(candidate: SmartNotificationCandidate, threshold = 45) {
  if (candidate.type === 'friend_entry' && candidate.canViewEntry === false) {
    return false;
  }

  return calculateNotificationInterest(candidate) >= threshold;
}
