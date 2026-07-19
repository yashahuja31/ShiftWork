import { compatibilityScore, getGraph, type EndingKey, type Stats } from './simulationEngine';
import type { SimulationRunRow } from './db';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  careerId: string;
  careerTitle: string;
  careerEmoji: string;
  difficulty: string;
  endingKey: EndingKey;
  endingTitle: string;
  score: number;
  createdAt: Date;
}

/**
 * Turns raw run rows into ranked, scored leaderboard entries. Scores aren't
 * stored in the database (see SimulationRun in schema.prisma) — they're
 * always recomputed from each run's final stats against that career's AND
 * difficulty's own calibration (see "Fixing the compatibility score" in
 * README.md for why difficulty matters here), the same way the ending
 * screen and the history page do it, so there's exactly one scoring
 * implementation to ever get out of sync.
 *
 * Runs whose `career` no longer matches anything in the current registry
 * (e.g. a career JSON was renamed or removed) are skipped rather than
 * crashing the leaderboard.
 *
 * Returns every entry, sorted by score descending, with NO slicing —
 * callers decide how many to show. This is deliberate: the careers page
 * fetches a bounded slice of recent runs and passes the full ranked list to
 * the client Leaderboard component, which needs more than 20 to filter by
 * career/difficulty and still have 20 left after filtering.
 */
export function rankRuns(runs: SimulationRunRow[]): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const run of runs) {
    let graph;
    try {
      graph = getGraph(run.career);
    } catch {
      continue;
    }

    const stats: Stats = {
      stress: run.finalStress,
      energy: run.finalEnergy,
      rep: run.finalRep,
      money: run.finalMoney,
      highlights: run.highlights,
    };
    const endingKey = run.endingKey as EndingKey;

    entries.push({
      id: run.id,
      userId: run.userId,
      careerId: run.career,
      careerTitle: graph.title,
      careerEmoji: graph.emoji,
      difficulty: run.difficulty,
      endingKey,
      endingTitle: graph.endings[endingKey]?.title ?? run.endingKey,
      score: compatibilityScore(stats, graph.calibration, run.difficulty),
      createdAt: run.createdAt,
    });
  }

  return entries.sort((a, b) => b.score - a.score);
}
