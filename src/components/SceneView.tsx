'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Choice, Scene } from '@/lib/simulationEngine';

interface SceneViewProps {
  sceneId: string;
  scene: Scene;
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

export function SceneView({ sceneId, scene, onChoose, disabled }: SceneViewProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sceneId}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-6"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-vital">{scene.time}</p>
        <p className="font-display text-2xl leading-relaxed text-ivory">{scene.text}</p>

        <div className="flex flex-col gap-3 mt-2">
          {scene.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(choice)}
              className="text-left rounded-lg border border-line bg-panel2 px-5 py-4 text-ivory hover:border-vital hover:bg-panel disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
