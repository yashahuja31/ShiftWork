'use client';

const MUTE_KEY = 'shiftwork-muted';

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      // Safari still needs the webkit-prefixed constructor as a fallback.
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioContext = new Ctor();
    } catch {
      return null;
    }
  }
  return audioContext;
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(value: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MUTE_KEY, value ? '1' : '0');
}

interface ToneOptions {
  frequency: number;
  duration: number; // seconds
  type?: OscillatorType;
  volume?: number;
  delay?: number; // seconds, for chaining notes into a short chime
}

/**
 * Plays one synthesized tone. Every call site here originates from a user
 * gesture (a choice click) or fires in the same render pass as one (the
 * ending chime, triggered by the choice click that ended the shift) —
 * browsers require a user gesture before audio will play at all, and
 * AudioContext starts "suspended" until one happens, which the resume()
 * call below handles.
 */
export function playTone({ frequency, duration, type = 'sine', volume = 0.07, delay = 0 }: ToneOptions): void {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const startAt = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playPositive(): void {
  playTone({ frequency: 660, duration: 0.16, type: 'sine' });
}

export function playNegative(): void {
  playTone({ frequency: 200, duration: 0.22, type: 'sine' });
}

/** A short three-note chime, shaped differently per ending tier. */
export function playEndingChime(tier: 'high' | 'mid' | 'low'): void {
  if (tier === 'high') {
    playTone({ frequency: 523.25, duration: 0.22 });
    playTone({ frequency: 659.25, duration: 0.22, delay: 0.15 });
    playTone({ frequency: 783.99, duration: 0.4, delay: 0.3 });
  } else if (tier === 'low') {
    playTone({ frequency: 220, duration: 0.4, volume: 0.06 });
    playTone({ frequency: 174.61, duration: 0.5, delay: 0.25, volume: 0.06 });
  } else {
    playTone({ frequency: 440, duration: 0.3 });
  }
}
