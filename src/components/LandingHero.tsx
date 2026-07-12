'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { CareerAvatar } from '@/components/CareerAvatar';
import type { Mood } from '@/lib/mood';

export interface CareerPreview {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  teaser: string; // narration from that career's signature decision scene
}

interface LandingHeroProps {
  isSignedIn: boolean;
  careers: CareerPreview[];
}

const INVITING_MOOD: Mood = { emoji: '😊', label: 'In the zone' };

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function LandingHero({ isSignedIn, careers }: LandingHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = prefersReducedMotion();
  const active = careers[activeIndex % careers.length];

  useEffect(() => {
    if (reduced || careers.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % careers.length);
    }, 4200);
    return () => clearInterval(id);
  }, [careers.length, reduced]);

  return (
    <>
      {/* soft ambient glow behind the hero for depth, not a hard gradient shift */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(62,207,142,0.10), transparent 70%)',
        }}
      />

      <motion.section
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.12 }}
        className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10 pb-20 pt-6"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
          <svg viewBox="0 0 800 120" className="w-full h-20" aria-hidden="true">
            <path
              d="M0,60 L200,60 L275,60 L285,20 L295,100 L305,40 L315,60 L500,60 L600,60 L675,60 L685,20 L695,100 L705,40 L715,60 L800,60"
              fill="none"
              stroke="#3ECF8E"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="800"
              className="animate-ecg"
              style={{ animationDuration: '2.4s' }}
            />
          </svg>
        </motion.div>

        <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.05 }} className="max-w-xl flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-vital">
            {careers.length} careers · one decision at a time
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory leading-tight">
            Live a full shift in someone else&apos;s career, before you commit to it.
          </h1>
          <p className="text-muted text-lg">
            Trauma surgeon, astronaut, pilot, firefighter, and more — every shift is a real
            branching day with a genuine high-stakes decision at its center. Every choice you
            make changes what happens next, and what you&apos;re like by the time you clock out.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
          <Link
            href={isSignedIn ? '/careers' : '/sign-up'}
            className="rounded-lg bg-vital text-ink font-medium px-8 py-3.5 hover:brightness-110 transition text-lg inline-block"
          >
            {isSignedIn ? 'Choose your shift' : 'Create a free account'}
          </Link>
        </motion.div>

        {/* Live rotating preview — the actual animated character and actual
            scene writing from a real career, cycling automatically. This is
            the "show, don't tell" version of "this game has interactive
            characters and real branching stories." */}
        {active && (
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-lg rounded-2xl border border-line bg-panel/60 backdrop-blur-sm p-6 sm:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <CareerAvatar careerId={active.id} mood={INVITING_MOOD} size={96} />
                <div>
                  <p className="font-display text-xl text-ivory">{active.title}</p>
                  <p className="text-sm text-muted">{active.tagline}</p>
                </div>
                <p className="font-display text-base text-ivory/90 italic leading-relaxed border-t border-line pt-4">
                  &ldquo;{active.teaser}&rdquo;
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-1.5 mt-6" aria-hidden="true">
              {careers.map((c, i) => (
                <span
                  key={c.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex % careers.length ? 'w-6 bg-vital' : 'w-1.5 bg-line'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-6 sm:gap-10 max-w-md text-left"
        >
          {[
            { step: '01', text: 'Pick a career and a difficulty' },
            { step: '02', text: 'Live the shift, one decision at a time' },
            { step: '03', text: 'See how you actually compare' },
          ].map((s) => (
            <div key={s.step}>
              <p className="font-mono text-xs text-vital mb-1">{s.step}</p>
              <p className="text-sm text-muted leading-snug">{s.text}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-3 max-w-lg"
        >
          {careers.map((career, i) => (
            <motion.button
              key={career.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="text-2xl opacity-70 hover:opacity-100 transition-opacity"
              title={career.title}
              aria-label={`Preview ${career.title}`}
            >
              {career.emoji}
            </motion.button>
          ))}
        </motion.div>

        <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="text-xs text-muted font-mono">
          {careers.length} careers live now, from the OR to the cockpit.
        </motion.p>
      </motion.section>
    </>
  );
}
