'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { pickRandomChoice, type Choice, type Scene } from '@/lib/simulationEngine';
import { SceneStage } from '@/components/SceneStage';

interface SceneViewProps {
  sceneId: string;
  scene: Scene;
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Reveals scene text one character at a time, like the moment is actually
 * unfolding rather than being dumped on screen. The component this hook
 * lives in is remounted per scene (keyed by sceneId from the parent), so the
 * lazy useState initializer below gives each scene a fresh "" start with no
 * setState call needed inside an effect body — the only setState left is
 * inside the setInterval callback, which is the standard "subscribe to an
 * external timer" pattern rather than an unconditional effect-body call.
 */
function useTypewriter(text: string, speed = 16): { shown: string; done: boolean } {
  const [shown, setShown] = useState<string>(() => (prefersReducedMotion() ? text : ''));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let i = 0;
    const id = setInterval(() => {
      i += 2; // two characters per tick reads as brisk, not sluggish
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { shown, done: shown.length >= text.length };
}

function SceneViewInner({ sceneId, scene, onChoose, disabled }: SceneViewProps) {
  const { shown, done } = useTypewriter(scene.text);
  const isBigDecision = scene.choices.length >= 4;
  const isRandomized = scene.randomized === true;

  // Randomized scenes aren't a player decision — once the text finishes
  // typing, auto-advance on a short beat instead of waiting for a click.
  // This is what keeps two playthroughs of the same career from feeling
  // identical: which branch fires here varies run to run. The pick is still
  // routed through the normal onChoose path, so it's recorded and replayed
  // exactly like a click would be — see pickRandomChoice in
  // simulationEngine.ts.
  useEffect(() => {
    if (!isRandomized || !done || disabled) return;
    const timer = setTimeout(() => onChoose(pickRandomChoice(scene)), 950);
    return () => clearTimeout(timer);
  }, [isRandomized, done, disabled, scene, onChoose]);

  return (
    <motion.div
      key={sceneId}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-vital">{scene.time}</p>

      <SceneStage environment={scene.environment} />

      <motion.div
        animate={
          isBigDecision
            ? { boxShadow: ['0 0 0px rgba(217,165,68,0)', '0 0 24px rgba(217,165,68,0.35)', '0 0 0px rgba(217,165,68,0)'] }
            : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
        }
        transition={isBigDecision ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
        className={`rounded-xl p-1 ${isBigDecision ? 'ring-1 ring-gold/30' : ''}`}
      >
        <p className="font-display text-2xl leading-relaxed text-ivory min-h-[4.5rem]">
          {shown}
          {!done && <span className="inline-block w-2 h-5 bg-vital/70 ml-0.5 animate-pulse align-middle" />}
        </p>
      </motion.div>

      {isRandomized ? (
        <motion.div
          initial={false}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2 text-muted font-mono text-xs uppercase tracking-widest"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-vital animate-pulse" />
          Events unfolding
        </motion.div>
      ) : (
        <motion.div
          initial={false}
          animate={{ opacity: done ? 1 : 0, pointerEvents: done ? 'auto' : 'none' }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-3 mt-2"
        >
          {scene.choices.map((choice, i) => (
            <motion.button
              key={choice.id}
              type="button"
              disabled={disabled || !done}
              onClick={() => onChoose(choice)}
              initial={{ opacity: 0, y: 8 }}
              animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.3, delay: done ? i * 0.06 : 0 }}
              whileTap={{ scale: 0.98 }}
              whileHover={done ? { scale: 1.01 } : undefined}
              className="text-left rounded-lg border border-line bg-panel2 px-5 py-4 text-ivory hover:border-vital hover:bg-panel disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {choice.text}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export function SceneView(props: SceneViewProps) {
  return (
    <AnimatePresence mode="wait">
      <SceneViewInner key={props.sceneId} {...props} />
    </AnimatePresence>
  );
}
