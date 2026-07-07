import sceneData from '@/data/trauma-surgeon-scenes.json';

export interface Effects {
  stress?: number;
  energy?: number;
  rep?: number;
  money?: number;
  patientsSaved?: number;
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

export interface SceneGraph {
  career: string;
  title: string;
  startScene: string;
  scenes: Record<string, Scene>;
}

export interface Stats {
  stress: number;
  energy: number;
  rep: number;
  money: number;
  patientsSaved: number;
}

export const INITIAL_STATS: Stats = {
  stress: 20,
  energy: 80,
  rep: 60,
  money: 420, // base shift pay
  patientsSaved: 0,
};

export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  normal: 1,
  realistic: 1.15,
  chaos: 1.35,
};

export const graph = sceneData as unknown as SceneGraph;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function applyEffects(stats: Stats, effects: Effects, difficulty: string): Stats {
  const mult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
  return {
    stress: clamp(stats.stress + Math.round((effects.stress ?? 0) * mult), 0, 100),
    energy: clamp(stats.energy + Math.round((effects.energy ?? 0) * (effects.energy && effects.energy < 0 ? mult : 1)), 0, 100),
    rep: clamp(stats.rep + (effects.rep ?? 0), 0, 100),
    money: Math.max(0, stats.money + (effects.money ?? 0)),
    patientsSaved: stats.patientsSaved + (effects.patientsSaved ?? 0),
  };
}

export type EndingKey = 'hero_of_the_shift' | 'steady_hand' | 'ordinary_day' | 'burned_out' | 'written_up';

export function determineEnding(stats: Stats): EndingKey {
  if (stats.energy <= 15 || stats.stress >= 88) return 'burned_out';
  if (stats.rep <= 35) return 'written_up';
  if (stats.rep >= 80 && stats.stress <= 60) return 'hero_of_the_shift';
  if (stats.rep >= 55) return 'steady_hand';
  return 'ordinary_day';
}

export const ENDINGS: Record<EndingKey, { title: string; blurb: string }> = {
  hero_of_the_shift: {
    title: 'Hero of the Shift',
    blurb: 'Every call held. The department is already talking about it — calmly, confidently, the way you like it.',
  },
  steady_hand: {
    title: 'Steady Hand',
    blurb: 'Nothing flashy. Nothing missed. The kind of day that quietly builds a reputation.',
  },
  ordinary_day: {
    title: 'Ordinary Day',
    blurb: 'A normal, forgettable Tuesday in trauma surgery — which, in this job, is its own kind of win.',
  },
  burned_out: {
    title: 'Running on Empty',
    blurb: "You made it to the parking lot, but there's nothing left in the tank. Tomorrow needs to look different.",
  },
  written_up: {
    title: 'Under Review',
    blurb: 'A few calls today are going to come up in tomorrow\u2019s case review. Nobody was hurt — but questions are coming.',
  },
};

export interface ReplayResult {
  finalStats: Stats;
  endingKey: EndingKey;
  scenesVisited: string[];
}

export class InvalidDecisionError extends Error {}

/**
 * Deterministically replays an ordered list of choice ids through the scene
 * graph, starting from INITIAL_STATS. This is what both the live UI (for
 * instant feedback) and the API route (for trustworthy persistence) use —
 * the API route NEVER accepts client-reported final stats, only the raw
 * decision ids, and recomputes everything itself. See SECURITY.md.
 */
export function replay(decisions: string[], difficulty: string): ReplayResult {
  let stats = INITIAL_STATS;
  let currentSceneId: string | null = graph.startScene;
  const scenesVisited: string[] = [];

  for (const decisionId of decisions) {
    if (!currentSceneId) {
      throw new InvalidDecisionError('Received a decision after the shift already ended.');
    }
    const scene: Scene | undefined = graph.scenes[currentSceneId];
    if (!scene) {
      throw new InvalidDecisionError(`Unknown scene "${currentSceneId}" in graph.`);
    }
    scenesVisited.push(currentSceneId);

    const choice: Choice | undefined = scene.choices.find((c) => c.id === decisionId);
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
