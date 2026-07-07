import { z } from 'zod';

export const difficulties = ['normal', 'realistic', 'chaos'] as const;

/**
 * What the client is allowed to send when saving a run: the difficulty and
 * the ordered list of choice ids it made. Notably ABSENT: finalStress,
 * finalEnergy, rep, money, patientsSaved, or the ending. Those are always
 * derived server-side by replaying `decisions` through the scene graph
 * (see src/lib/simulationEngine.ts). A client can lie about its own final
 * score; it cannot lie about which branch of the story it took, because the
 * server checks every choice id against what was actually available at that
 * node.
 */
export const saveRunSchema = z.object({
  difficulty: z.enum(difficulties),
  decisions: z
    .array(z.string().min(1).max(64))
    .min(1)
    .max(50), // generous ceiling -- the whole scene graph is 17 nodes deep
});

export type SaveRunInput = z.infer<typeof saveRunSchema>;

export const narrateRequestSchema = z.object({
  sceneId: z.string().min(1).max(64),
  stress: z.number().int().min(0).max(100),
  currentTime: z.string().min(1).max(16),
});

export type NarrateRequestInput = z.infer<typeof narrateRequestSchema>;
