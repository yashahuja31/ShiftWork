'use client';

import { motion } from 'framer-motion';
import { labelForEnvironment } from '@/lib/sceneEnvironments';

interface SceneStageProps {
  environment?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const VIEW = '0 0 400 90';

/**
 * Each environment gets a small hand-built animated scene — several layered
 * SVG shapes in motion together, not one icon bouncing. This is the
 * "video/GIF"-style visual the game needed, built as original vector
 * animation instead of sourced footage: it costs nothing to ship, can't run
 * into licensing problems, stays a few KB instead of megabytes of video,
 * and (unlike a fixed clip) is free to react to game state later if that's
 * ever worth doing.
 */
function Vignette({ environment, reduced }: { environment: string; reduced: boolean }) {
  const loop = (duration: number, repeatDelay = 0) => (reduced ? undefined : { duration, repeat: Infinity, repeatDelay, ease: 'easeInOut' as const });

  switch (environment) {
    case 'commute':
      return (
        <>
          <line x1="0" y1="70" x2="400" y2="70" stroke="#243049" strokeWidth="2" />
          {/* dashed road markings sliding past under the car */}
          <motion.g
            animate={reduced ? undefined : { x: [0, -60] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 60, 120, 180, 240, 300, 360, 420].map((x) => (
              <rect key={x} x={x} y="68" width="24" height="3" rx="1.5" fill="#182238" />
            ))}
          </motion.g>
          <motion.g animate={reduced ? undefined : { x: [-30, 30, -30] }} transition={loop(2.2)}>
            <rect x="150" y="48" width="70" height="24" rx="8" fill="#121A2B" stroke="#3ECF8E" strokeWidth="2" />
            <rect x="164" y="36" width="38" height="18" rx="6" fill="#121A2B" stroke="#3ECF8E" strokeWidth="2" />
            <circle cx="168" cy="74" r="7" fill="#0B1220" stroke="#3ECF8E" strokeWidth="2" />
            <circle cx="204" cy="74" r="7" fill="#0B1220" stroke="#3ECF8E" strokeWidth="2" />
          </motion.g>
        </>
      );

    case 'briefing': {
      const people = [140, 200, 260];
      return (
        <>
          <line x1="0" y1="75" x2="400" y2="75" stroke="#243049" strokeWidth="2" />
          {people.map((x, i) => (
            <g key={x}>
              <circle cx={x} cy="42" r="11" fill="#182238" stroke="#7C8AA5" strokeWidth="2" />
              <path d={`M${x - 16},74 Q${x},50 ${x + 16},74 Z`} fill="#182238" stroke="#7C8AA5" strokeWidth="2" />
              <motion.g
                animate={reduced ? undefined : { opacity: [0, 0, 1, 1, 0], scale: [0.7, 0.7, 1, 1, 0.7] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  times: [0, i * 0.28, i * 0.28 + 0.06, i * 0.28 + 0.28, i * 0.28 + 0.34],
                }}
                style={{ transformOrigin: `${x + 14}px 24px` }}
              >
                <rect x={x + 8} y="12" width="30" height="18" rx="6" fill="#3ECF8E" />
                <path d={`M${x + 14},30 l4,6 l4,-6 Z`} fill="#3ECF8E" />
              </motion.g>
            </g>
          ))}
        </>
      );
    }

    case 'rest':
      return (
        <>
          <motion.g animate={reduced ? undefined : { x: [-20, 20, -20] }} transition={loop(6)}>
            <ellipse cx="120" cy="26" rx="34" ry="10" fill="#182238" opacity="0.6" />
            <ellipse cx="150" cy="22" rx="26" ry="8" fill="#182238" opacity="0.5" />
          </motion.g>
          <path
            d="M290,20 A22,22 0 1 0 292,62 A17,17 0 0 1 290,20 Z"
            fill="#7C8AA5"
          />
          {[
            { x: 250, y: 30, r: 1.8, delay: 0 },
            { x: 265, y: 55, r: 1.4, delay: 0.6 },
            { x: 330, y: 25, r: 2, delay: 1.2 },
            { x: 345, y: 50, r: 1.5, delay: 0.3 },
          ].map((s) => (
            <motion.circle
              key={`${s.x}-${s.y}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#E8ECF1"
              animate={reduced ? undefined : { opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
            />
          ))}
        </>
      );

    case 'alert':
      return (
        <>
          <motion.path
            d="M0,45 L140,45 L152,45 L160,15 L168,75 L176,30 L184,45 L400,45"
            fill="none"
            stroke="#E85D5D"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="600"
            strokeDashoffset="0"
            initial={{ strokeDashoffset: 0 }}
            animate={reduced ? undefined : { strokeDashoffset: [0, -600] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.g
            animate={reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
            transition={loop(0.8)}
            style={{ transformOrigin: '340px 45px' }}
          >
            <path d="M340,25 L358,58 L322,58 Z" fill="none" stroke="#E85D5D" strokeWidth="3" strokeLinejoin="round" />
            <line x1="340" y1="38" x2="340" y2="48" stroke="#E85D5D" strokeWidth="3" strokeLinecap="round" />
            <circle cx="340" cy="53" r="1.6" fill="#E85D5D" />
          </motion.g>
        </>
      );

    case 'social':
      return (
        <>
          <motion.g
            animate={reduced ? undefined : { scale: [1, 1.08, 1], y: [0, -3, 0] }}
            transition={loop(1.4)}
            style={{ transformOrigin: '130px 40px' }}
          >
            <rect x="90" y="24" width="80" height="34" rx="14" fill="#182238" stroke="#D9A544" strokeWidth="2" />
            <path d="M108,58 l0,14 l16,-14 Z" fill="#182238" stroke="#D9A544" strokeWidth="2" />
          </motion.g>
          <motion.g
            animate={reduced ? undefined : { scale: [1, 1.08, 1], y: [0, -3, 0] }}
            transition={{ ...loop(1.4), delay: 0.7 }}
            style={{ transformOrigin: '280px 52px' }}
          >
            <rect x="230" y="38" width="80" height="30" rx="14" fill="#182238" stroke="#3ECF8E" strokeWidth="2" />
            <path d="M292,68 l0,12 l14,-12 Z" fill="#182238" stroke="#3ECF8E" strokeWidth="2" />
          </motion.g>
        </>
      );

    case 'outdoors':
      return (
        <>
          <line x1="0" y1="75" x2="400" y2="75" stroke="#243049" strokeWidth="2" />
          <motion.g
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '330px 30px' }}
          >
            <circle cx="330" cy="30" r="14" fill="#D9A544" opacity="0.85" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1={330 + Math.cos((deg * Math.PI) / 180) * 20}
                y1={30 + Math.sin((deg * Math.PI) / 180) * 20}
                x2={330 + Math.cos((deg * Math.PI) / 180) * 26}
                y2={30 + Math.sin((deg * Math.PI) / 180) * 26}
                stroke="#D9A544"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </motion.g>
          {[70, 110].map((x, i) => (
            <motion.g
              key={x}
              animate={reduced ? undefined : { rotate: [-6, 6, -6] }}
              transition={{ ...loop(2.8), delay: i * 0.5 }}
              style={{ transformOrigin: `${x}px 75px` }}
            >
              <path d={`M${x},75 L${x},52 M${x - 10},58 L${x},44 L${x + 10},58 Z`} fill="#3ECF8E" stroke="#3ECF8E" strokeWidth="2" strokeLinejoin="round" />
            </motion.g>
          ))}
        </>
      );

    case 'paperwork':
      return (
        <>
          <rect x="140" y="18" width="90" height="56" rx="4" fill="#182238" stroke="#7C8AA5" strokeWidth="2" />
          {[30, 42, 54].map((y) => (
            <line key={y} x1="152" y1={y} x2="206" y2={y} stroke="#7C8AA5" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          <motion.line
            x1="150" y1="64" x2="150" y2="64"
            animate={reduced ? undefined : { x2: [150, 218, 150] }}
            transition={loop(1.8)}
            stroke="#D9A544"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <motion.g
            animate={reduced ? undefined : { opacity: [0, 0, 1, 1, 0], scale: [0.6, 0.6, 1, 1, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.7, 0.78, 0.92, 1] }}
            style={{ transformOrigin: '245px 40px' }}
          >
            <circle cx="245" cy="40" r="14" fill="none" stroke="#3ECF8E" strokeWidth="2.5" />
            <path d="M238,40 l5,6 l10,-12" fill="none" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.g>
        </>
      );

    case 'work':
    default:
      return (
        <>
          <motion.g
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '200px 45px' }}
          >
            <circle cx="200" cy="45" r="16" fill="none" stroke="#D9A544" strokeWidth="4" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <rect
                key={deg}
                x="196"
                y="22"
                width="8"
                height="10"
                rx="2"
                fill="#D9A544"
                transform={`rotate(${deg} 200 45)`}
              />
            ))}
            <circle cx="200" cy="45" r="5" fill="#121A2B" />
          </motion.g>
          {[{ x: 250, delay: 0 }, { x: 265, delay: 0.6 }, { x: 235, delay: 1.2 }].map((s) => (
            <motion.circle
              key={s.x}
              cx={s.x}
              cy="35"
              r="2"
              fill="#D9A544"
              animate={reduced ? undefined : { y: [0, -14], opacity: [1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: s.delay, ease: 'easeOut' }}
            />
          ))}
        </>
      );
  }
}

export function SceneStage({ environment }: SceneStageProps) {
  const env = environment ?? 'work';
  const reduced = prefersReducedMotion();

  return (
    <div className="rounded-xl border border-line bg-panel overflow-hidden">
      <svg viewBox={VIEW} className="w-full h-20" role="img" aria-label={labelForEnvironment(environment)}>
        <Vignette environment={env} reduced={reduced} />
      </svg>
      <div className="px-3 py-1.5 border-t border-line">
        <span className="text-[10px] uppercase tracking-widest font-mono text-muted">{labelForEnvironment(environment)}</span>
      </div>
    </div>
  );
}
