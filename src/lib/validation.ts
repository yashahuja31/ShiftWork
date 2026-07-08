import { z } from 'zod';
import { CAREER_IDS } from './simulationEngine';

export const difficulties = ['normal', 'realistic', 'chaos'] as const;

/**
 * What the client is allowed to send when saving a run: which career, the
 * difficulty, and the ordered list of choice ids it made. Notably ABSENT:
 * finalStress, finalEnergy, rep, money, highlights, or the ending. Those are
 * always derived server-side by replaying `decisions` through that career's
 * scene graph (see src/lib/simulationEngine.ts). A client can lie about its
 * own final score; it cannot lie about which branch of the story it took,
 * because the server checks every choice id against what was actually
 * available at that node in that career's graph.
 */
export const saveRunSchema = z.object({
  career: z.enum(CAREER_IDS),
  difficulty: z.enum(difficulties),
  decisions: z
    .array(z.string().min(1).max(64))
    .min(1)
    .max(50), // generous ceiling -- no career graph is anywhere near this deep
});

export type SaveRunInput = z.infer<typeof saveRunSchema>;

export const narrateRequestSchema = z.object({
  career: z.enum(CAREER_IDS),
  sceneId: z.string().min(1).max(64),
  stress: z.number().int().min(0).max(100),
  currentTime: z.string().min(1).max(16),
});

export type NarrateRequestInput = z.infer<typeof narrateRequestSchema>;
