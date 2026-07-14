import { compatibilityScore, getGraph, type EndingKey, type Stats } from './simulationEngine';
import type { SimulationRunRow } from './db';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  careerId: string;
  careerTitle: string;
  careerEmoji: string;
  endingKey: EndingKey;
  endingTitle: string;
  score: number;
  createdAt: Date;
}

/**
 * Turns raw run rows into ranked, scored leaderboard entries. Scores aren't
 * stored in the database (see SimulationRun in schema.prisma) — they're
 * always recomputed from each run's final stats against that career's own
 * calibration, the same way the ending screen and the history page do it,
 * so there's exactly one scoring implementation to ever get out of sync.
 *
 * Runs whose `career` no longer matches anything in the current registry
 * (e.g. a career JSON was renamed or removed) are skipped rather than
 * crashing the leaderboard.
 */
export function rankRuns(runs: SimulationRunRow[], limit = 20): LeaderboardEntry[] {
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
      endingKey,
      endingTitle: graph.endings[endingKey]?.title ?? run.endingKey,
      score: compatibilityScore(stats, graph.calibration),
      createdAt: run.createdAt,
    });
  }

  return entries.sort((a, b) => b.score - a.score).slice(0, limit);
}
