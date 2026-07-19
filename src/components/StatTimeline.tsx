'use client';

import { motion } from 'framer-motion';
import type { TimelineStep } from '@/lib/simulationEngine';

interface StatTimelineProps {
  timeline: TimelineStep[];
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD_X = 8;
const PAD_Y = 14;

interface Series {
  key: 'stress' | 'energy' | 'rep';
  label: string;
  color: string;
}

const SERIES: Series[] = [
  { key: 'stress', label: 'Stress', color: '#E85D5D' },
  { key: 'energy', label: 'Energy', color: '#3ECF8E' },
  { key: 'rep', label: 'Reputation', color: '#D9A544' },
];

function pointsFor(timeline: TimelineStep[], key: Series['key']): string {
  if (timeline.length === 0) return '';
  const stepWidth = (WIDTH - PAD_X * 2) / Math.max(1, timeline.length - 1);
  return timeline
    .map((step, i) => {
      const x = PAD_X + i * stepWidth;
      const value = step.stats[key];
      const y = HEIGHT - PAD_Y - (value / 100) * (HEIGHT - PAD_Y * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

export function StatTimeline({ timeline }: StatTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs uppercase tracking-widest text-vital">How the shift went</p>
        <div className="flex gap-3">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-40" role="img" aria-label="Stress, energy, and reputation over the course of the shift">
        {/* gridlines at 0/50/100 */}
        {[0, 50, 100].map((v) => {
          const y = HEIGHT - PAD_Y - (v / 100) * (HEIGHT - PAD_Y * 2);
          return <line key={v} x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} stroke="#243049" strokeWidth="1" />;
        })}

        {SERIES.map((s) => {
          const points = pointsFor(timeline, s.key);
          return (
            <motion.polyline
              key={s.key}
              points={points}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-[10px] font-mono text-muted">
        <span>{timeline[0]?.time}</span>
        <span>{timeline[timeline.length - 1]?.time}</span>
      </div>
    </div>
  );
}
