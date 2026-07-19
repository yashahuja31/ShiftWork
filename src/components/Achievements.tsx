import type { AchievementResult } from '@/lib/achievements';

export function Achievements({ achievements }: { achievements: AchievementResult[] }) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="rounded-xl border border-line bg-panel p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-vital">Achievements</p>
        <span className="text-[10px] font-mono text-muted">
          {unlockedCount}/{achievements.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={`${a.title} — ${a.description}`}
            className={`flex flex-col items-center gap-1.5 w-16 text-center ${a.unlocked ? '' : 'opacity-35'}`}
          >
            <div
              className={`w-11 h-11 rounded-full border flex items-center justify-center text-xl ${
                a.unlocked ? 'border-vital/40 bg-vital/10' : 'border-line bg-panel2 grayscale'
              }`}
              aria-hidden="true"
            >
              {a.icon}
            </div>
            <span className={`text-[9px] leading-tight ${a.unlocked ? 'text-ivory' : 'text-muted'}`}>{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
