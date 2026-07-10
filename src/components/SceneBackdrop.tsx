'use client';

import { motion } from 'framer-motion';
import { EnvironmentIcon, labelForEnvironment } from '@/lib/sceneEnvironments';

interface AnimConfig {
  animate: Record<string, number[]>;
  duration: number;
  color: string;
}

// Each environment gets its own *kind* of motion, not just a different
// icon — a small but real distinction between "this scene is a commute"
// (side-to-side, like movement) and "this scene is an emergency" (a sharp,
// fast pulse) versus "downtime" (slow, gentle drift).
const ANIMATIONS: Record<string, AnimConfig> = {
  commute: { animate: { x: [-3, 3, -3] }, duration: 1.1, color: '#3ECF8E' },
  briefing: { animate: { scale: [1, 1.1, 1] }, duration: 2.4, color: '#7C8AA5' },
  rest: { animate: { y: [0, 3, 0], opacity: [0.7, 1, 0.7] }, duration: 3.4, color: '#7C8AA5' },
  alert: { animate: { scale: [1, 1.18, 1] }, duration: 0.85, color: '#E85D5D' },
  social: { animate: { y: [0, -4, 0] }, duration: 1.0, color: '#D9A544' },
  outdoors: { animate: { rotate: [-7, 7, -7] }, duration: 2.6, color: '#3ECF8E' },
  paperwork: { animate: { rotate: [0, -9, 0] }, duration: 1.5, color: '#7C8AA5' },
  work: { animate: { rotate: [0, 14, 0, -14, 0] }, duration: 2.2, color: '#D9A544' },
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function SceneBackdrop({ environment }: { environment?: string }) {
  const config = ANIMATIONS[environment ?? 'work'] ?? ANIMATIONS.work!;
  const reduced = prefersReducedMotion();

  return (
    <div className="flex items-center gap-1.5" title={labelForEnvironment(environment)}>
      <motion.div
        animate={reduced ? undefined : config.animate}
        transition={{ duration: config.duration, repeat: Infinity, ease: 'easeInOut' }}
        style={{ color: config.color }}
        className="flex items-center justify-center"
      >
        <EnvironmentIcon environment={environment} size={18} />
      </motion.div>
      <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: config.color }}>
        {labelForEnvironment(environment)}
      </span>
    </div>
  );
}
