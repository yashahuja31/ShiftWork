'use client';

import { AnimatePresence, motion } from 'framer-motion';

export interface DeltaBadge {
  id: string;
  label: string;
  value: number;
  isMoney?: boolean;
}

interface FloatingDeltasProps {
  badges: DeltaBadge[];
}

function colorFor(value: number): string {
  if (value > 0) return 'text-vital border-vital/40 bg-vital/10';
  return 'text-alert border-alert/40 bg-alert/10';
}

export function FloatingDeltas({ badges }: FloatingDeltasProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap justify-center gap-2 z-20"
      aria-live="polite"
    >
      <AnimatePresence>
        {badges.map((badge, i) => (
          <motion.span
            key={badge.id}
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: -36, scale: 1 }}
            exit={{ opacity: 0, y: -56 }}
            transition={{ duration: 1.4, delay: i * 0.06, ease: 'easeOut' }}
            className={`font-mono text-xs font-semibold rounded-full border px-2.5 py-1 ${colorFor(badge.value)}`}
          >
            {badge.value > 0 ? '+' : ''}
            {badge.value}
            {badge.isMoney ? '$' : ''} {badge.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
