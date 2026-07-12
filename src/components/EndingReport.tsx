'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { compatibilityScore, getEnding, getGraph, type EndingKey, type Stats } from '@/lib/simulationEngine';
import { moodFor } from '@/lib/mood';
import { CareerAvatar } from '@/components/CareerAvatar';

interface EndingReportProps {
  careerId: string;
  stats: Stats;
  endingKey: EndingKey;
  saving: 'idle' | 'saving' | 'saved' | 'error';
  highlightLabel: string;
}

const CONFETTI_COLORS = ['#3ECF8E', '#D9A544', '#E8ECF1'];

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

/** A small, on-brand confetti burst — only for the best ending. */
function Confetti() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (i / 18) * Math.PI * 2 + Math.random() * 0.4,
      distance: 90 + Math.random() * 90,
      size: 5 + Math.random() * 4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? '#3ECF8E',
      delay: Math.random() * 0.15,
    })),
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 flex justify-center overflow-visible z-10">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance * 0.6 + 40,
            rotate: 260,
          }}
          transition={{ duration: 1.3, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? '9999px' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export function EndingReport({ careerId, stats, endingKey, saving, highlightLabel }: EndingReportProps) {
  const graph = getGraph(careerId);
  const ending = getEnding(careerId, endingKey);
  const score = compatibilityScore(stats, graph.calibration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, x: 0 }}
      animate={{
        opacity: 1,
        y: 0,
        // A brief shake reads as "rattled" for the roughest ending — every
        // other ending settles in cleanly with no shake at all.
        x: endingKey === 'burned_out' ? [0, -6, 6, -4, 4, 0] : 0,
      }}
      transition={{
        opacity: { duration: 0.4 },
        y: { duration: 0.4 },
        x: { duration: 0.5, ease: 'easeInOut' },
      }}
      className="relative max-w-xl mx-auto flex flex-col gap-6"
    >
      {endingKey === 'triumphant' && <Confetti />}

      <div className="flex justify-center">
        <CareerAvatar careerId={careerId} mood={moodFor(stats)} ending={endingKey} size={140} />
      </div>

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
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono">{highlightLabel}</p>
          <p className="font-mono text-2xl text-ivory">{stats.highlights}</p>
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

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
        className="rounded-xl border border-vital/40 bg-vital/5 p-6 text-center"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted font-mono mb-1">Career compatibility</p>
        <p className="font-display text-5xl text-vital">{score}%</p>
        <p className="text-xs text-muted mt-1">
          Better than {score}% of people who&apos;ve tried this shift
        </p>
      </motion.div>

      <p className="text-xs font-mono text-muted text-center">
        {saving === 'saving' && 'Saving your run…'}
        {saving === 'saved' && 'Run saved to your history.'}
        {saving === 'error' && "Couldn't save this run — you can still see your results above."}
      </p>

      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href={`/simulation/${careerId}`}
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
        <Link
          href="/history"
          className="rounded-lg border border-line text-ivory font-medium px-5 py-2.5 hover:border-vital transition"
        >
          View history
        </Link>
      </div>
    </motion.div>
  );
}
