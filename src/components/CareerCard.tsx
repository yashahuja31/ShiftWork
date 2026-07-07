'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CareerCardProps {
  emoji: string;
  title: string;
  tagline: string;
  href?: string;
  locked?: boolean;
}

export function CareerCard({ emoji, title, tagline, href, locked }: CareerCardProps) {
  const inner = (
    <motion.div
      whileHover={locked ? undefined : { y: -4 }}
      className={`rounded-xl border p-6 h-full flex flex-col gap-3 transition-colors ${
        locked
          ? 'border-line bg-panel/40 opacity-50 cursor-not-allowed'
          : 'border-line bg-panel hover:border-vital cursor-pointer'
      }`}
    >
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <h3 className="font-display text-xl text-ivory">{title}</h3>
      <p className="text-sm text-muted flex-1">{tagline}</p>
      <span className={`text-xs font-mono uppercase tracking-widest ${locked ? 'text-muted' : 'text-vital'}`}>
        {locked ? 'Coming soon' : 'Start shift →'}
      </span>
    </motion.div>
  );

  if (locked || !href) {
    return <div aria-disabled="true">{inner}</div>;
  }

  return <Link href={href}>{inner}</Link>;
}
