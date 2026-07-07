'use client';

import { useMemo, useState } from 'react';
import {
  applyEffects,
  determineEnding,
  graph,
  INITIAL_STATS,
  type Choice,
  type EndingKey,
  type Stats,
} from '@/lib/simulationEngine';
import { SceneView } from '@/components/SceneView';
import { VitalsMonitor } from '@/components/VitalsMonitor';
import { EndingReport } from '@/components/EndingReport';

type Difficulty = 'normal' | 'realistic' | 'chaos';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function SimulationClient() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [sceneId, setSceneId] = useState<string>(graph.startScene);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [ending, setEnding] = useState<EndingKey | null>(null);
  const [saving, setSaving] = useState<SaveState>('idle');

  const scene = useMemo(() => graph.scenes[sceneId], [sceneId]);

  async function persistRun(finalDecisions: string[], finalDifficulty: Difficulty) {
    setSaving('saving');
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: finalDifficulty, decisions: finalDecisions }),
      });
      if (!res.ok) throw new Error('save failed');
      setSaving('saved');
    } catch {
      setSaving('error');
    }
  }

  function handleChoose(choice: Choice) {
    if (!difficulty) return;
    const nextStats = applyEffects(stats, choice.effects, difficulty);
    const nextDecisions = [...decisions, choice.id];
    setStats(nextStats);
    setDecisions(nextDecisions);

    if (!choice.next) {
      const finalEnding = determineEnding(nextStats);
      setEnding(finalEnding);
      void persistRun(nextDecisions, difficulty);
      return;
    }
    setSceneId(choice.next);
  }

  if (!difficulty) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full flex flex-col gap-6 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-vital">
            {graph.title}
          </p>
          <h1 className="font-display text-3xl text-ivory">Pick your difficulty</h1>
          <p className="text-muted text-sm">
            Chaos mode leans harder into every complication — same story, higher stakes.
          </p>
          <div className="flex flex-col gap-3">
            {(['normal', 'realistic', 'chaos'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="rounded-lg border border-line bg-panel px-5 py-3 text-ivory capitalize hover:border-vital transition"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (ending) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <EndingReport stats={stats} endingKey={ending} saving={saving} />
      </main>
    );
  }

  if (!scene) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <p className="text-white">Loading scene...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 sm:px-10 py-10 max-w-3xl mx-auto flex flex-col gap-8">
      <VitalsMonitor stats={stats} time={scene.time} />
      <SceneView sceneId={sceneId} scene={scene} onChoose={handleChoose} />
    </main>
  );
}
