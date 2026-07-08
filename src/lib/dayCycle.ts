/**
 * Turns a scene's human-readable time string into an hour-of-day (0-23) and
 * a matching ambient background gradient — the thing that makes the
 * simulation feel like a day actually passing rather than a static form.
 * Handles both "07:00 AM"/"PM" strings and 24-hour "ship time" strings
 * (used by the astronaut career, which has no local AM/PM).
 */
export function parseHour(time: string): number {
  const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    const hourStr = ampmMatch[1] ?? '12';
    const meridiem = ampmMatch[3] ?? 'AM';
    let hh = parseInt(hourStr, 10) % 12;
    if (meridiem.toUpperCase() === 'PM') hh += 12;
    return hh;
  }
  const rawMatch = time.match(/^(\d{1,2}):(\d{2})/);
  if (rawMatch) {
    return parseInt(rawMatch[1] ?? '12', 10) % 24;
  }
  return 12; // sensible fallback: midday
}

export interface DayGradient {
  from: string;
  to: string;
  label: string;
}

const GRADIENTS: DayGradient[] = [
  { from: '#0B1220', to: '#141d33', label: 'deep night' }, // 0
  { from: '#0B1220', to: '#141d33', label: 'deep night' }, // 1
  { from: '#0B1220', to: '#141d33', label: 'deep night' }, // 2
  { from: '#0B1220', to: '#141d33', label: 'deep night' }, // 3
  { from: '#0f1830', to: '#2a2440', label: 'pre-dawn' }, // 4
  { from: '#1a1f3a', to: '#3d2f4d', label: 'dawn' }, // 5
  { from: '#22243f', to: '#4a3a4a', label: 'sunrise' }, // 6
  { from: '#1c2740', to: '#3a4a5a', label: 'early morning' }, // 7
  { from: '#152238', to: '#26415a', label: 'morning' }, // 8
  { from: '#12203a', to: '#1f3d5c', label: 'mid-morning' }, // 9
  { from: '#101e3a', to: '#1a3a5c', label: 'late morning' }, // 10
  { from: '#0f1d3a', to: '#17395c', label: 'midday' }, // 11
  { from: '#0e1c3a', to: '#15365c', label: 'noon' }, // 12
  { from: '#0f1d3a', to: '#17395c', label: 'early afternoon' }, // 13
  { from: '#101e3a', to: '#1a3a5c', label: 'afternoon' }, // 14
  { from: '#12203a', to: '#264055', label: 'mid-afternoon' }, // 15
  { from: '#18223c', to: '#3a3d55', label: 'late afternoon' }, // 16
  { from: '#221f3a', to: '#4a3450', label: 'golden hour' }, // 17
  { from: '#2a1f3a', to: '#523a48', label: 'sunset' }, // 18
  { from: '#1c1a35', to: '#3a2a45', label: 'dusk' }, // 19
  { from: '#12152e', to: '#241f3a', label: 'early night' }, // 20
  { from: '#0d1128', to: '#1a1a30', label: 'night' }, // 21
  { from: '#0a0e22', to: '#15152a', label: 'late night' }, // 22
  { from: '#0B1220', to: '#141d33', label: 'deep night' }, // 23
];

const MIDDAY_FALLBACK: DayGradient = { from: '#0e1c3a', to: '#15365c', label: 'noon' };

export function gradientForTime(time: string): DayGradient {
  // parseHour always returns 0-23 and GRADIENTS always has exactly 24
  // entries, but TypeScript's noUncheckedIndexedAccess can't prove that
  // statically, so a (never-actually-used) fallback keeps the return type
  // honest without a non-null assertion.
  return GRADIENTS[parseHour(time)] ?? MIDDAY_FALLBACK;
}
