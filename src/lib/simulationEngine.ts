import traumaSurgeon from '@/data/careers/trauma-surgeon.json';
import astronaut from '@/data/careers/astronaut.json';
import detective from '@/data/careers/detective.json';
import chef from '@/data/careers/chef.json';
import pilot from '@/data/careers/pilot.json';
import wildlifePhotographer from '@/data/careers/wildlife-photographer.json';
import investmentBanker from '@/data/careers/investment-banker.json';
import airTrafficController from '@/data/careers/air-traffic-controller.json';

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
}

export type EndingKey = 'triumphant' | 'steady_hand' | 'ordinary_day' | 'burned_out' | 'written_up';

export interface EndingCopy {
  title: string;
  blurb: string;
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

// Ending thresholds are deliberately career-agnostic — every career uses the
// same 0-100 stat scale, so one set of rules works for all of them. Only the
// title/blurb text (in each career's JSON, under "endings") changes per
// career. If a future career needs genuinely different thresholds (e.g. a
// career where high stress is the *goal*), swap this for a per-graph
// threshold function at that point — don't overfit this file for a case
// that doesn't exist yet.
export function determineEnding(stats: Stats): EndingKey {
  if (stats.energy <= 15 || stats.stress >= 88) return 'burned_out';
  if (stats.rep <= 35) return 'written_up';
  if (stats.rep >= 80 && stats.stress <= 60) return 'triumphant';
  if (stats.rep >= 55) return 'steady_hand';
  return 'ordinary_day';
}

export function getEnding(careerId: string, key: EndingKey): EndingCopy {
  return getGraph(careerId).endings[key];
}

// Each ending key maps to a score band. This is deliberately NOT a single
// continuous formula over the raw stats — an earlier version was, and it
// turned out the actual reachable stat combinations in these scene graphs
// never drove the formula below the low 50s even on a maximally reckless
// playthrough, so the number felt meaningless ("nothing I do changes this").
// Tying the band to the ending itself guarantees the number actually tracks
// the outcome the player just read: burned out or written up reads as a low
// score, full stop, and *within* a band the player's composure/reputation
// still moves the number, so identical endings aren't always identical
// scores either.
const SCORE_BANDS: Record<EndingKey, [number, number]> = {
  triumphant: [85, 99],
  steady_hand: [65, 84],
  ordinary_day: [45, 64],
  written_up: [25, 44],
  burned_out: [5, 24],
};

export function compatibilityScore(stats: Stats, endingKey: EndingKey): number {
  const [lo, hi] = SCORE_BANDS[endingKey];
  const composure = 100 - stats.stress;
  const factor = Math.min(1, Math.max(0, (stats.rep * 0.6 + composure * 0.4) / 100));
  return Math.round(lo + factor * (hi - lo));
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

  return { finalStats: stats, endingKey: determineEnding(stats), scenesVisited };
}
