import Link from 'next/link';
import type { Recommendation } from '@/lib/recommendations';

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 mb-6">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">Based on your shifts</p>
      <p className="text-ivory text-sm mb-4">{recommendation.blurb}</p>
      <div className="flex flex-wrap gap-2">
        {recommendation.careers.map((c) => (
          <Link
            key={c.id}
            href={`/simulation/${c.id}`}
            className="flex items-center gap-2 rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-ivory hover:border-gold/50 transition-colors"
          >
            <span aria-hidden="true">{c.emoji}</span>
            {c.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
