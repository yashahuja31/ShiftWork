import { CAREER_GRAPHS } from './simulationEngine';
import type { LeaderboardEntry } from './leaderboard';

export interface Recommendation {
  blurb: string;
  careers: { id: string; title: string; emoji: string; tagline: string }[];
}

const MIN_RUNS = 3;

// One line of framing per trait, written to read like an observation about
// the player rather than a label — this is the closest thing to the
// original brainstorm doc's "AI career recommendation" feature, but built
// as a deterministic aggregation over real run data instead of an LLM call:
// more reliable, free to run, and the reasoning is inspectable rather than
// a black box.
const TRAIT_BLURBS: Record<string, string> = {
  'high-pressure': "You consistently hold up well under pressure — here's more of that.",
  precision: 'Your best runs come from careers that reward getting the details exactly right.',
  analytical: "You do well when a shift is really a puzzle to work through — you're built for that.",
  'high-stakes': "The higher the stakes, the better you seem to do. Don't stop there.",
  'hands-on': "You score best in careers where the work is physical and immediate.",
  creative: 'Your strongest shifts are the ones with real creative latitude.',
  patient: 'Careers that reward patience over speed are where you shine.',
  'people-focused': 'You do best in careers built around other people, not just tasks.',
  physical: 'Physically demanding shifts play to your strengths.',
  'fast-paced': 'You thrive when the pace never lets up.',
  solitary: 'Careers with real solitude are where your best runs happen.',
  communication: 'Careers built on communication are your strongest ground.',
  'people-reading': 'Reading people under pressure is clearly a strength of yours.',
  responsibility: 'You do best carrying real, direct responsibility for outcomes.',
  isolation: 'Careers that isolate you from constant check-ins are where you do best.',
};

/**
 * Looks at which trait tags show up on the player's best-scoring runs, then
 * recommends unplayed careers sharing that trait. Returns null if there's
 * not enough history yet to say anything meaningful — a recommendation
 * from one or two runs is closer to noise than signal.
 */
export function computeRecommendation(entries: LeaderboardEntry[]): Recommendation | null {
  if (entries.length < MIN_RUNS) return null;

  const playedCareerIds = new Set(entries.map((e) => e.careerId));

  // Average score per trait, across every run whose career carries that
  // trait — a player who did well in three different "high-pressure"
  // careers gives that trait a strong signal even if each individual
  // career was only played once.
  const traitScores = new Map<string, { total: number; count: number }>();
  for (const entry of entries) {
    const graph = CAREER_GRAPHS[entry.careerId];
    if (!graph) continue;
    for (const trait of graph.traits) {
      const bucket = traitScores.get(trait) ?? { total: 0, count: 0 };
      bucket.total += entry.score;
      bucket.count += 1;
      traitScores.set(trait, bucket);
    }
  }

  let bestTrait: string | null = null;
  let bestAvg = -1;
  for (const [trait, { total, count }] of traitScores) {
    const avg = total / count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestTrait = trait;
    }
  }
  if (!bestTrait) return null;

  const unplayed = Object.values(CAREER_GRAPHS)
    .filter((g) => !playedCareerIds.has(g.id) && g.traits.includes(bestTrait))
    .slice(0, 3)
    .map((g) => ({ id: g.id, title: g.title, emoji: g.emoji, tagline: g.tagline }));

  if (unplayed.length === 0) return null; // they've already played everything with this trait

  return {
    blurb: TRAIT_BLURBS[bestTrait] ?? `You do well in "${bestTrait}" careers — here are more.`,
    careers: unplayed,
  };
}
