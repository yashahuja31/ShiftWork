import traumaSurgeon from '@/data/careers/trauma-surgeon.json';
import astronaut from '@/data/careers/astronaut.json';
import detective from '@/data/careers/detective.json';
import chef from '@/data/careers/chef.json';
import pilot from '@/data/careers/pilot.json';
import wildlifePhotographer from '@/data/careers/wildlife-photographer.json';
import investmentBanker from '@/data/careers/investment-banker.json';
import airTrafficController from '@/data/careers/air-traffic-controller.json';
import firefighter from '@/data/careers/firefighter.json';
import teacher from '@/data/careers/teacher.json';
import paramedic from '@/data/careers/paramedic.json';
import softwareEngineer from '@/data/careers/software-engineer.json';

export interface Effects {
  stress?: number;
  energy?: number;
  rep?: number;
  money?: number;
  highlights?: number;
}

export interface Choice {
  id: string;
  text: string;
  next: string | null;
  effects: Effects;
}

export interface Scene {
  time: string;
  text: string;
  choices: Choice[];
  // When true, this scene isn't a player decision — the UI auto-selects one
  // of `choices` at random (weighted equally) and narrates the outcome
  // instead of showing buttons. This is what keeps replays from feeling
  // identical every time: the same "wake up" scene might route through a
  // different minor complication on run 2 than it did on run 1. The pick is
  // still recorded as a normal choice id in the decisions list, so replay()
  // and server-side scoring don't need to know or care that it was
  // auto-selected rather than clicked — see SimulationClient.tsx.
  randomized?: boolean;
  // A coarse category of what's physically happening in the scene (commute,
  // briefing, rest, alert, ...), used purely for the animated scene-backdrop
  // icon (SceneBackdrop.tsx / lib/sceneEnvironments.tsx) — it has no effect
  // on scoring or engine logic. Falls back to "work" if omitted.
  environment?: string;
}

export type EndingKey = 'triumphant' | 'steady_hand' | 'ordinary_day' | 'burned_out' | 'written_up';

export interface EndingCopy {
  title: string;
  blurb: string;
}

// Percentile checkpoints of the "performance index" (see performanceIndex
// below) under pure-random play, computed offline by
// scripts/calibrate_careers.py and stored per career. This is what the
// compatibility score and ending are actually measured against — see the
// long comment above compatibilityScore for why.
export interface Calibration {
  p1: number;
  p5: number;
  p10: number;
  p25: number;
  p35: number;
  p50: number;
  p65: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface SceneGraph {
  id: string;
  title: string;
  emoji: string;
  tagline: string;
  highlightLabel: string; // e.g. "Patients saved", "Shots captured"
  startScene: string;
  scenes: Record<string, Scene>;
  endings: Record<EndingKey, EndingCopy>;
  calibration: Calibration;
}

// The full career library. Adding a new career means adding one JSON file
// to src/data/careers/ and one line here — nothing else in this file
// changes. See README.md > "Adding a new career".
export const CAREER_GRAPHS: Record<string, SceneGraph> = {
  trauma_surgeon: traumaSurgeon as unknown as SceneGraph,
  astronaut: astronaut as unknown as SceneGraph,
  detective: detective as unknown as SceneGraph,
  chef: chef as unknown as SceneGraph,
  pilot: pilot as unknown as SceneGraph,
  wildlife_photographer: wildlifePhotographer as unknown as SceneGraph,
  investment_banker: investmentBanker as unknown as SceneGraph,
  air_traffic_controller: airTrafficController as unknown as SceneGraph,
  firefighter: firefighter as unknown as SceneGraph,
  teacher: teacher as unknown as SceneGraph,
  paramedic: paramedic as unknown as SceneGraph,
  software_engineer: softwareEngineer as unknown as SceneGraph,
};

export const CAREER_IDS = Object.keys(CAREER_GRAPHS) as [string, ...string[]];

export class InvalidDecisionError extends Error {}

export function getGraph(careerId: string): SceneGraph {
  const graph = CAREER_GRAPHS[careerId];
  if (!graph) {
    throw new InvalidDecisionError(`Unknown career "${careerId}".`);
  }
  return graph;
}

export function getScene(graph: SceneGraph, sceneId: string): Scene {
  const scene = graph.scenes[sceneId];
  if (!scene) {
    throw new InvalidDecisionError(`Unknown scene "${sceneId}" in career "${graph.id}".`);
  }
  return scene;
}

export interface Stats {
  stress: number;
  energy: number;
  rep: number;
  money: number;
  highlights: number;
}

export const INITIAL_STATS: Stats = {
  stress: 20,
  energy: 80,
  rep: 60,
  money: 420, // base pay for the day
  highlights: 0,
};

export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  normal: 1,
  realistic: 1.15,
  chaos: 1.35,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function applyEffects(stats: Stats, effects: Effects, difficulty: string): Stats {
  const mult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
  return {
    stress: clamp(stats.stress + Math.round((effects.stress ?? 0) * mult), 0, 100),
    energy: clamp(
      stats.energy + Math.round((effects.energy ?? 0) * (effects.energy && effects.energy < 0 ? mult : 1)),
      0,
      100,
    ),
    rep: clamp(stats.rep + (effects.rep ?? 0), 0, 100),
    money: Math.max(0, stats.money + (effects.money ?? 0)),
    highlights: stats.highlights + (effects.highlights ?? 0),
  };
}

// A single composite read on "how did the day go" — reputation-weighted,
// with composure (inverse of stress) and remaining energy contributing
// less. This number on its own is meaningless in absolute terms (its
// reachable range differs by career, by how generous that career's scene
// effects happen to be); what makes it meaningful is comparing it against
// that SAME career's calibration below.
export function performanceIndex(stats: Stats): number {
  const composure = 100 - stats.stress;
  return stats.rep * 0.5 + composure * 0.3 + stats.energy * 0.2;
}

const PERCENTILE_KEYS = [1, 5, 10, 25, 35, 50, 65, 75, 90, 95, 99] as const;

// Where does this performance index fall, as a percentile, against 20,000
// simulated random playthroughs of this exact career (see
// scripts/calibrate_careers.py)? This is the fix for the compatibility
// score problem: an earlier version used one fixed formula/threshold set
// for every career, and testing showed it could never produce a score below
// the mid-50s no matter how badly someone played, because the actual
// reachable stats in these scene graphs just don't get "bad" in absolute
// terms very often. Comparing against a per-career random-play baseline
// instead means the score is always relative to what an average attempt at
// THIS SPECIFIC career actually looks like — so a below-average run
// genuinely and reliably scores below 50, a well-played run scores high,
// and no career is quietly "impossible to fail" or "impossible to ace" just
// because of how its numbers happen to be tuned.
function percentileRank(perf: number, calibration: Calibration): number {
  const points = PERCENTILE_KEYS.map((p) => ({ pct: p, value: calibration[`p${p}` as keyof Calibration] }));
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (perf <= first.value) return first.pct;
  if (perf >= last.value) return last.pct;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (perf >= a.value && perf <= b.value) {
      const span = b.value - a.value;
      const frac = span === 0 ? 0 : (perf - a.value) / span;
      return a.pct + frac * (b.pct - a.pct);
    }
  }
  return 50;
}

export function determineEnding(stats: Stats, calibration: Calibration): EndingKey {
  const rank = percentileRank(performanceIndex(stats), calibration);
  if (rank < 10) return 'burned_out';
  if (rank < 35) return 'written_up';
  if (rank < 65) return 'ordinary_day';
  if (rank < 90) return 'steady_hand';
  return 'triumphant';
}

export function getEnding(careerId: string, key: EndingKey): EndingCopy {
  return getGraph(careerId).endings[key];
}

/**
 * The displayed "would you enjoy this career?" score. This IS the
 * percentile rank from percentileRank(), which is deliberately the whole
 * point: the number means "you did better than N% of people who tried this
 * exact career by picking randomly," which is both an honest description of
 * what's being measured and, empirically, produces a full and meaningful
 * 1-99 spread instead of clustering near the top. See
 * scripts/calibrate_careers.py for how each career's baseline was measured.
 */
export function compatibilityScore(stats: Stats, calibration: Calibration): number {
  return Math.round(percentileRank(performanceIndex(stats), calibration));
}

export interface ReplayResult {
  finalStats: Stats;
  endingKey: EndingKey;
  scenesVisited: string[];
}

/**
 * Deterministically replays an ordered list of choice ids through a career's
 * scene graph, starting from INITIAL_STATS. Both the live UI (instant
 * feedback) and the API route (trustworthy persistence) call this — the API
 * route NEVER accepts client-reported final stats, only the career id and
 * the raw decision ids, and recomputes everything itself. See SECURITY.md.
 */
export function replay(careerId: string, decisions: string[], difficulty: string): ReplayResult {
  const graph = getGraph(careerId);
  let stats = INITIAL_STATS;
  let currentSceneId: string | null = graph.startScene;
  const scenesVisited: string[] = [];

  for (const decisionId of decisions) {
    if (!currentSceneId) {
      throw new InvalidDecisionError('Received a decision after the shift already ended.');
    }
    const scene: Scene = getScene(graph, currentSceneId);
    scenesVisited.push(currentSceneId);

    const choice: Choice | undefined = scene.choices.find((c: Choice) => c.id === decisionId);
    if (!choice) {
      // Someone sent a choice id that isn't valid for the current scene —
      // either a bug or a tampered request. Reject rather than guess.
      throw new InvalidDecisionError(
        `Choice "${decisionId}" is not valid for scene "${currentSceneId}".`,
      );
    }

    stats = applyEffects(stats, choice.effects, difficulty);
    currentSceneId = choice.next;
  }

  return { finalStats: stats, endingKey: determineEnding(stats, graph.calibration), scenesVisited };
}

/**
 * For scenes marked `randomized: true`, the UI doesn't render buttons — it
 * picks one of the scene's choices itself (uniformly at random) and treats
 * it exactly like a player click from then on: same effects, same
 * decisions-array entry, same replay behavior. Centralized here so the
 * client and any future server-side simulation use identical odds.
 */
export function pickRandomChoice(scene: Scene): Choice {
  const { choices } = scene;
  const pick = choices[Math.floor(Math.random() * choices.length)];
  // choices is always non-empty (validated by scripts/validate-careers.py),
  // but keep TypeScript honest under noUncheckedIndexedAccess.
  return pick ?? choices[0]!;
}
