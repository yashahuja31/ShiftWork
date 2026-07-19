import type { LeaderboardEntry } from './leaderboard';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AchievementResult extends Achievement {
  unlocked: boolean;
}

interface AchievementDef extends Achievement {
  check: (entries: LeaderboardEntry[], totalCareers: number) => boolean;
}

// Every condition here is a pure function over a user's own ranked runs —
// no new database table or tracked event needed, since SimulationRun
// already has everything (career, difficulty, ending, score) these check.
const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_shift',
    title: 'First Shift',
    description: 'Complete your first shift.',
    icon: '🎬',
    check: (entries) => entries.length >= 1,
  },
  {
    id: 'seasoned',
    title: 'Seasoned',
    description: 'Complete 10 shifts.',
    icon: '🔟',
    check: (entries) => entries.length >= 10,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Try at least 6 different careers.',
    icon: '🧭',
    check: (entries) => new Set(entries.map((e) => e.careerId)).size >= 6,
  },
  {
    id: 'jack_of_all_trades',
    title: 'Jack of All Trades',
    description: 'Try every career at least once.',
    icon: '🗂️',
    check: (entries, totalCareers) => new Set(entries.map((e) => e.careerId)).size >= totalCareers,
  },
  {
    id: 'hero_streak',
    title: 'Hero Streak',
    description: 'Earn 5 triumphant endings.',
    icon: '🏆',
    check: (entries) => entries.filter((e) => e.endingKey === 'triumphant').length >= 5,
  },
  {
    id: 'chaos_survivor',
    title: 'Chaos Survivor',
    description: 'Finish a chaos-mode shift without burning out.',
    icon: '🔥',
    check: (entries) => entries.some((e) => e.difficulty === 'chaos' && e.endingKey !== 'burned_out'),
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Score 95% or higher on a shift.',
    icon: '💯',
    check: (entries) => entries.some((e) => e.score >= 95),
  },
  {
    id: 'well_rounded',
    title: 'Well-Rounded',
    description: 'Complete a shift on every difficulty.',
    icon: '⚖️',
    check: (entries) => new Set(entries.map((e) => e.difficulty)).size >= 3,
  },
];

export function computeAchievements(entries: LeaderboardEntry[], totalCareers: number): AchievementResult[] {
  return ACHIEVEMENTS.map(({ check, ...achievement }) => ({
    ...achievement,
    unlocked: check(entries, totalCareers),
  }));
}
