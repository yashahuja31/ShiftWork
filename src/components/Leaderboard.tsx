'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LeaderboardEntry } from '@/lib/leaderboard';

interface CareerOption {
  id: string;
  title: string;
  emoji: string;
}

interface LeaderboardProps {
  globalEntries: LeaderboardEntry[];
  personalEntries: LeaderboardEntry[];
  currentUserId: string;
  careers: CareerOption[];
}

type View = 'global' | 'personal';
type DifficultyFilter = 'all' | 'normal' | 'realistic' | 'chaos';

const SHOWN = 20;

function relativeTime(date: Date): string {
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function rankStyle(rank: number): string {
  if (rank === 1) return 'text-gold border-gold/40 bg-gold/10';
  if (rank === 2) return 'text-ivory border-line bg-panel2';
  if (rank === 3) return 'text-vital border-vital/30 bg-vital/5';
  return 'text-muted border-line bg-panel2';
}

function EntryRow({ entry, rank, showYouTag }: { entry: LeaderboardEntry; rank: number; showYouTag: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, delay: rank * 0.02 }}
      className="flex items-center gap-3 py-2.5 border-b border-line last:border-0"
    >
      <span
        className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-mono font-semibold ${rankStyle(rank)}`}
      >
        {rank}
      </span>
      <span className="text-lg shrink-0" aria-hidden="true">
        {entry.careerEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ivory truncate">
          {entry.careerTitle}
          {showYouTag && <span className="text-vital font-mono text-[10px] uppercase tracking-widest ml-2">you</span>}
        </p>
        <p className="text-xs text-muted truncate">
          {entry.endingTitle} · <span className="capitalize">{entry.difficulty}</span> · {relativeTime(entry.createdAt)}
        </p>
      </div>
      <span className="font-mono text-sm text-vital shrink-0">{entry.score}%</span>
    </motion.div>
  );
}

function EmptyState({ view, filtered }: { view: View; filtered: boolean }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-muted">
        {filtered
          ? 'Nothing matches those filters yet.'
          : view === 'global'
            ? 'No shifts logged yet — be the first.'
            : "You haven't played a shift yet."}
      </p>
    </div>
  );
}

export function Leaderboard({ globalEntries, personalEntries, currentUserId, careers }: LeaderboardProps) {
  const [view, setView] = useState<View>('global');
  const [careerFilter, setCareerFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

  const allEntries = view === 'global' ? globalEntries : personalEntries;

  const filtered = useMemo(() => {
    return allEntries.filter(
      (e) => (careerFilter === 'all' || e.careerId === careerFilter) && (difficultyFilter === 'all' || e.difficulty === difficultyFilter),
    );
  }, [allEntries, careerFilter, difficultyFilter]);

  const shown = filtered.slice(0, SHOWN);
  const isFiltered = careerFilter !== 'all' || difficultyFilter !== 'all';

  return (
    <div className="rounded-xl border border-line bg-panel p-5 sticky top-10">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-vital">Leaderboard</p>
        <span className="text-[10px] font-mono text-muted">Top {shown.length || SHOWN}</span>
      </div>

      {/* Smooth segmented toggle — a single sliding highlight (via layoutId)
          rather than two independently-styled buttons, so switching views
          reads as one control moving, not two buttons swapping colors. */}
      <div className="relative flex rounded-lg border border-line bg-panel2 p-1 mb-3">
        {(['global', 'personal'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className="relative flex-1 py-1.5 text-xs font-mono uppercase tracking-widest rounded-md transition-colors"
          >
            {view === v && (
              <motion.span
                layoutId="leaderboard-toggle-highlight"
                className="absolute inset-0 bg-vital rounded-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${view === v ? 'text-ink' : 'text-muted'}`}>
              {v === 'global' ? 'Global' : 'Personal'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={careerFilter}
          onChange={(e) => setCareerFilter(e.target.value)}
          className="flex-1 min-w-0 bg-panel2 border border-line rounded-md text-xs font-mono text-ivory px-2 py-1.5 focus-visible:outline-vital"
        >
          <option value="all">All careers</option>
          {careers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.title}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
          className="bg-panel2 border border-line rounded-md text-xs font-mono text-ivory px-2 py-1.5 capitalize focus-visible:outline-vital"
        >
          <option value="all">All modes</option>
          <option value="normal">Normal</option>
          <option value="realistic">Realistic</option>
          <option value="chaos">Chaos</option>
        </select>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${careerFilter}-${difficultyFilter}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {shown.length === 0 ? (
            <EmptyState view={view} filtered={isFiltered} />
          ) : (
            shown.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                rank={i + 1}
                showYouTag={view === 'global' && entry.userId === currentUserId}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
