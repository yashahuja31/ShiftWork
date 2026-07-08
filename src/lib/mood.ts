import type { Stats } from './simulationEngine';

export interface Mood {
  emoji: string;
  label: string;
}

export function moodFor(stats: Stats): Mood {
  if (stats.energy <= 20) return { emoji: '😴', label: 'Running on empty' };
  if (stats.stress >= 80) return { emoji: '😰', label: 'Overwhelmed' };
  if (stats.stress <= 30 && stats.energy >= 60) return { emoji: '😊', label: 'In the zone' };
  if (stats.stress >= 60) return { emoji: '😬', label: 'Tense' };
  return { emoji: '🙂', label: 'Focused' };
}
