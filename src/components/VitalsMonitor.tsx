'use client';

import type { Stats } from '@/lib/simulationEngine';

interface VitalsMonitorProps {
  stats: Stats;
  time: string;
}

// One QRS-complex "blip" repeated 4 times across the viewBox, offset so it
// tiles seamlessly when the dashoffset animates past a full cycle.
const ECG_PATH =
  'M0,60 L60,60 L75,60 L85,20 L95,100 L105,40 L115,60 L200,60 ' +
  'L260,60 L275,60 L285,20 L295,100 L305,40 L315,60 L400,60 ' +
  'L460,60 L475,60 L485,20 L495,100 L505,40 L515,60 L600,60 ' +
  'L660,60 L675,60 L685,20 L695,100 L705,40 L715,60 L800,60';

function speedFor(stress: number): number {
  // 3.2s at rest -> 0.9s at maximum stress. Faster sweep reads as "urgent"
  // without needing any text label.
  const clamped = Math.min(100, Math.max(0, stress));
  return 3.2 - (clamped / 100) * 2.3;
}

function colorFor(stress: number): string {
  if (stress >= 85) return '#E85D5D'; // alert
  if (stress >= 60) return '#D9A544'; // caution
  return '#3ECF8E'; // nominal
}

function Stat({ label, value, suffix = '' }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-muted font-mono">{label}</span>
      <span className="text-lg font-mono text-ivory">
        {value}
        {suffix}
      </span>
    </div>
  );
}

export function VitalsMonitor({ stats, time }: VitalsMonitorProps) {
  const stroke = colorFor(stats.stress);
  const duration = speedFor(stats.stress);

  return (
    <div className="rounded-xl border border-line bg-panel p-4" role="group" aria-label="Vitals monitor">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-muted tracking-widest">SHIFT CLOCK</span>
        <span className="font-mono text-sm text-ivory">{time}</span>
      </div>

      <svg
        viewBox="0 0 800 120"
        className="w-full h-16"
        aria-label={`Heart rhythm, stress level ${stats.stress} out of 100`}
        role="img"
      >
        <path
          d={ECG_PATH}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="800"
          className="animate-ecg"
          style={{ animationDuration: `${duration}s` }}
        />
      </svg>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-3 pt-3 border-t border-line">
        <Stat label="Stress" value={stats.stress} />
        <Stat label="Energy" value={stats.energy} />
        <Stat label="Reputation" value={stats.rep} />
        <Stat label="Patients" value={stats.patientsSaved} />
        <Stat label="Pay" value={stats.money} suffix="$" />
      </div>
    </div>
  );
}
