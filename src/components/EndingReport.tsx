'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ENDINGS, type EndingKey, type Stats } from '@/lib/simulationEngine';

interface EndingReportProps {
  stats: Stats;
  endingKey: EndingKey;
  saving: 'idle' | 'saving' | 'saved' | 'error';
}

function compatibilityScore(stats: Stats): number {
  // A simple, transparent heuristic: composure under pressure (low stress
  // relative to rep) plus overall performance. Not a clinical instrument —
  // just a fun, legible number to close the loop the way the spec asked for.
  const composure = 100 - stats.stress;
  const raw = stats.rep * 0.5 + composure * 0.3 + Math.min(stats.energy, 100) * 0.2;
  return Math.round(Math.min(99, Math.max(5, raw)));
}

export function EndingReport({ stats, endingKey, saving }: EndingReportProps) {
  const ending = ENDINGS[endingKey];
  const score = compatibilityScore(stats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto flex flex-col gap-6"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-vital mb-2">Shift complete</p>
        <h1 className="font-display text-4xl text-ivory mb-2">{ending.title}</h1>
        <p className="text-muted">{ending.blurb}</p>
      </div>

      <div className="rounded-xl border border-line bg-panel p-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Stress endured</p>
          <p className="font-mono text-2xl text-ivory">{stats.stress}/100</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Patients saved</p>
          <p className="font-mono text-2xl text-ivory">{stats.patientsSaved}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Reputation</p>
          <p className="font-mono text-2xl text-ivory">{stats.rep}/100</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Pay earned</p>
          <p className="font-mono text-2xl text-gold">${stats.money}</p>
        </div>
      </div>

      <div className="rounded-xl border border-vital/40 bg-vital/5 p-6 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted font-mono mb-1">
          Would you enjoy this career?
        </p>
        <p className="font-display text-5xl text-vital">{score}%</p>
      </div>

      <p className="text-xs font-mono text-muted text-center">
        {saving === 'saving' && 'Saving your run…'}
        {saving === 'saved' && 'Run saved to your history.'}
        {saving === 'error' && "Couldn't save this run — you can still see your results above."}
      </p>

      <div className="flex gap-3 justify-center">
        <Link
          href="/simulation"
          className="rounded-lg bg-vital text-ink font-medium px-5 py-2.5 hover:brightness-110 transition"
        >
          Run it again
        </Link>
        <Link
          href="/careers"
          className="rounded-lg border border-line text-ivory font-medium px-5 py-2.5 hover:border-vital transition"
        >
          Back to careers
        </Link>
      </div>
    </motion.div>
  );
}
