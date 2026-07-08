'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  applyEffects,
  determineEnding,
  getGraph,
  getScene,
  INITIAL_STATS,
  type Choice,
  type EndingKey,
  type Stats,
} from '@/lib/simulationEngine';
import { gradientForTime } from '@/lib/dayCycle';
import { SceneView } from '@/components/SceneView';
import { VitalsMonitor } from '@/components/VitalsMonitor';
import { EndingReport } from '@/components/EndingReport';
import { FloatingDeltas, type DeltaBadge } from '@/components/FloatingDeltas';

type Difficulty = 'normal' | 'realistic' | 'chaos';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SimulationClientProps {
  careerId: string;
}

const EFFECT_LABELS: Record<string, string> = {
  stress: 'STRESS',
  energy: 'ENERGY',
  rep: 'REP',
  money: 'PAY',
  highlights: '',
};

export function SimulationClient({ careerId }: SimulationClientProps) {
  const graph = useMemo(() => getGraph(careerId), [careerId]);

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [sceneId, setSceneId] = useState<string>(graph.startScene);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [ending, setEnding] = useState<EndingKey | null>(null);
  const [saving, setSaving] = useState<SaveState>('idle');
  const [badges, setBadges] = useState<DeltaBadge[]>([]);

  const scene = useMemo(() => getScene(graph, sceneId), [graph, sceneId]);
  const gradient = useMemo(() => gradientForTime(scene.time), [scene.time]);

  async function persistRun(finalDecisions: string[], finalDifficulty: Difficulty) {
    setSaving('saving');
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career: careerId, difficulty: finalDifficulty, decisions: finalDecisions }),
      });
      if (!res.ok) throw new Error('save failed');
      setSaving('saved');
    } catch {
      setSaving('error');
    }
  }

  function showDeltaBadges(effects: Choice['effects']) {
    const stamp = Date.now();
    const next: DeltaBadge[] = Object.entries(effects)
      .filter(([, value]) => typeof value === 'number' && value !== 0)
      .map(([key, value]) => ({
        id: `${stamp}-${key}`,
        label: key === 'highlights' ? graph.highlightLabel.toUpperCase() : EFFECT_LABELS[key] ?? key.toUpperCase(),
        value: value as number,
        isMoney: key === 'money',
      }));
    setBadges(next);
    // Clear after the fly-up animation finishes so they don't linger as
    // static text once framer-motion's exit transition completes.
    setTimeout(() => setBadges([]), 1700);
  }

  function handleChoose(choice: Choice) {
    if (!difficulty) return;
    showDeltaBadges(choice.effects);
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
          <Link href="/careers" className="text-xs font-mono text-muted hover:text-ivory self-start">
            ← Back to careers
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-vital">
            {graph.emoji} {graph.title}
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
        <EndingReport careerId={careerId} stats={stats} endingKey={ending} saving={saving} highlightLabel={graph.highlightLabel} />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-6 sm:px-10 py-10"
      style={{
        backgroundImage: `linear-gradient(160deg, ${gradient.from}, ${gradient.to})`,
        transition: 'background-image 1400ms ease',
      }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div className="relative">
          <FloatingDeltas badges={badges} />
          <VitalsMonitor stats={stats} time={scene.time} highlightLabel={graph.highlightLabel} />
        </div>
        <SceneView sceneId={sceneId} scene={scene} onChoose={handleChoose} />
      </div>
    </main>
  );
}
