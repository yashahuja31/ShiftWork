'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Mood } from '@/lib/mood';
import { CareerIcon } from '@/lib/careerIcons';
import type { EndingKey } from '@/lib/simulationEngine';

interface CareerAvatarProps {
  careerId: string;
  mood: Mood;
  /** True during the career's signature 4-choice decision — adds a pulsing alert ring. */
  tense?: boolean;
  /** Only passed on the ending screen, overrides the mood-driven pose with a final one. */
  ending?: EndingKey;
  size?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Pose {
  headTilt: number;
  leftHand: Point;
  rightHand: Point;
  browAngle: number;
  mouth: string;
  bobSeconds: number;
  eyeScale: number;
  glow: boolean;
}

const MOUTHS: Record<'smile' | 'grin' | 'flat' | 'frown' | 'open', string> = {
  smile: 'M64,68 Q80,80 96,68',
  grin: 'M58,66 Q80,88 102,66',
  flat: 'M68,72 Q80,72 92,72',
  frown: 'M64,76 Q80,62 96,76',
  open: 'M68,66 Q80,90 92,66',
};

const MOOD_POSES: Record<string, Pose> = {
  'Running on empty': {
    headTilt: 9,
    leftHand: { x: 42, y: 152 },
    rightHand: { x: 118, y: 152 },
    browAngle: 4,
    mouth: MOUTHS.flat,
    bobSeconds: 4.6,
    eyeScale: 0.35,
    glow: false,
  },
  Overwhelmed: {
    headTilt: -3,
    leftHand: { x: 36, y: 118 },
    rightHand: { x: 124, y: 118 },
    browAngle: 16,
    mouth: MOUTHS.open,
    bobSeconds: 1.5,
    eyeScale: 1,
    glow: false,
  },
  'In the zone': {
    headTilt: 0,
    leftHand: { x: 40, y: 124 },
    rightHand: { x: 122, y: 102 },
    browAngle: -6,
    mouth: MOUTHS.grin,
    bobSeconds: 2.6,
    eyeScale: 1,
    glow: true,
  },
  Tense: {
    headTilt: 3,
    leftHand: { x: 43, y: 128 },
    rightHand: { x: 117, y: 128 },
    browAngle: 14,
    mouth: MOUTHS.flat,
    bobSeconds: 2.0,
    eyeScale: 1,
    glow: false,
  },
  Focused: {
    headTilt: 0,
    leftHand: { x: 43, y: 130 },
    rightHand: { x: 117, y: 130 },
    browAngle: 4,
    mouth: MOUTHS.smile,
    bobSeconds: 2.8,
    eyeScale: 1,
    glow: false,
  },
};

const ENDING_POSES: Partial<Record<EndingKey, Pose>> = {
  triumphant: {
    headTilt: -5,
    leftHand: { x: 28, y: 62 },
    rightHand: { x: 132, y: 62 },
    browAngle: -8,
    mouth: MOUTHS.grin,
    bobSeconds: 1.8,
    eyeScale: 1,
    glow: true,
  },
  burned_out: {
    headTilt: 15,
    leftHand: { x: 46, y: 162 },
    rightHand: { x: 114, y: 162 },
    browAngle: 6,
    mouth: MOUTHS.flat,
    bobSeconds: 5,
    eyeScale: 0.2,
    glow: false,
  },
  written_up: {
    headTilt: 5,
    leftHand: { x: 56, y: 140 },
    rightHand: { x: 104, y: 140 },
    browAngle: 13,
    mouth: MOUTHS.flat,
    bobSeconds: 2.2,
    eyeScale: 1,
    glow: false,
  },
};

function poseFor(mood: Mood, ending?: EndingKey): Pose {
  if (ending && ENDING_POSES[ending]) return ENDING_POSES[ending]!;
  return MOOD_POSES[mood.label] ?? MOOD_POSES.Focused!;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function CareerAvatar({ careerId, mood, tense, ending, size = 128 }: CareerAvatarProps) {
  const pose = poseFor(mood, ending);
  const reduced = prefersReducedMotion();

  // A gentle blink every few seconds — a small "alive" detail that costs
  // almost nothing but reads as a real character rather than a static icon.
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 140);
    }, 3200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="relative inline-block" style={{ width: size, height: size * 1.1 }}>
      <motion.svg
        viewBox="0 0 160 180"
        className="w-full h-full overflow-visible"
        animate={
          reduced
            ? undefined
            : { y: [0, -4, 0], rotate: [pose.headTilt * 0.15, pose.headTilt * 0.15, pose.headTilt * 0.15] }
        }
        transition={{ duration: pose.bobSeconds, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Tension aura for the big-decision moments */}
        {tense && (
          <motion.circle
            cx="80"
            cy="60"
            r="52"
            fill="none"
            stroke="#D9A544"
            strokeWidth="2"
            animate={{ opacity: [0.1, 0.5, 0.1], r: [50, 58, 50] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* Calm "in the zone" / triumphant glow */}
        {pose.glow && (
          <motion.circle
            cx="80"
            cy="55"
            r="46"
            fill="#3ECF8E"
            animate={{ opacity: [0.08, 0.22, 0.08] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.g animate={{ rotate: pose.headTilt }} style={{ transformOrigin: '80px 95px' }} transition={{ duration: 0.6 }}>
          {/* Arms (drawn first so the torso overlaps their shoulder joins cleanly).
              `initial` is required here even though it matches `animate` on
              first mount — x2/y2 are raw SVG geometry attributes with no
              framer-motion-known default (unlike transform props like
              rotate/y, which default to 0), so without an explicit starting
              value the very first render tries to animate from "undefined"
              and throws exactly the console warning this fixes. */}
          <motion.line
            x1="58" y1="112"
            initial={{ x2: pose.leftHand.x, y2: pose.leftHand.y }}
            animate={{ x2: pose.leftHand.x, y2: pose.leftHand.y }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            stroke="#182238" strokeWidth="11" strokeLinecap="round"
          />
          <motion.line
            x1="102" y1="112"
            initial={{ x2: pose.rightHand.x, y2: pose.rightHand.y }}
            animate={{ x2: pose.rightHand.x, y2: pose.rightHand.y }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            stroke="#182238" strokeWidth="11" strokeLinecap="round"
          />

          {/* Torso */}
          <rect x="45" y="95" width="70" height="75" rx="30" fill="#121A2B" stroke="#243049" strokeWidth="2" />

          {/* Neck + head */}
          <rect x="70" y="86" width="20" height="16" fill="#E8ECF1" />
          <circle cx="80" cy="55" r="38" fill="#E8ECF1" />

          {/* Eyebrows — rotate is a transform prop with a built-in 0 default,
              so no initial value is needed here the way it is for x2/y2/ry. */}
          <motion.line
            x1="58" y1="42" x2="70" y2="42"
            animate={{ rotate: pose.browAngle }}
            style={{ transformOrigin: '64px 42px' }}
            stroke="#0B1220" strokeWidth="3" strokeLinecap="round"
          />
          <motion.line
            x1="90" y1="42" x2="102" y2="42"
            animate={{ rotate: -pose.browAngle }}
            style={{ transformOrigin: '96px 42px' }}
            stroke="#0B1220" strokeWidth="3" strokeLinecap="round"
          />

          {/* Eyes — same "needs an initial" reasoning as the arms above. */}
          <motion.ellipse
            cx="65" cy="52" rx="4.5"
            initial={{ ry: 4.5 * pose.eyeScale }}
            animate={{ ry: blinking ? 0.5 : 4.5 * pose.eyeScale }}
            transition={{ duration: 0.12 }}
            fill="#0B1220"
          />
          <motion.ellipse
            cx="95" cy="52" rx="4.5"
            initial={{ ry: 4.5 * pose.eyeScale }}
            animate={{ ry: blinking ? 0.5 : 4.5 * pose.eyeScale }}
            transition={{ duration: 0.12 }}
            fill="#0B1220"
          />

          {/* Mouth */}
          <motion.path
            initial={{ d: pose.mouth }}
            animate={{ d: pose.mouth }}
            transition={{ duration: 0.4 }}
            fill="none"
            stroke="#0B1220"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.svg>

      {/* Career prop badge, positioned over the character's chest */}
      <div
        className="absolute flex items-center justify-center rounded-full bg-vital text-ink shadow-lg"
        style={{
          width: size * 0.28,
          height: size * 0.28,
          left: '70%',
          top: '74%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CareerIcon careerId={careerId} size={size * 0.16} strokeWidth={2.25} />
      </div>
    </div>
  );
}
