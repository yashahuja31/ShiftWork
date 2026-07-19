'use client';

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, setMuted } from '@/lib/sound';

export function SoundToggle() {
  // Lazy initializer reads the real localStorage value directly on first
  // render — both the server pass (where isMuted()'s typeof window guard
  // returns a safe default) and the client hydration pass (where it reads
  // the real value). This can make the very first client render disagree
  // with the server-rendered HTML for one frame, which is why
  // suppressHydrationWarning is on the button below: this is the standard,
  // recommended pattern for "state that only really exists in the
  // browser" (localStorage-backed prefs, theme toggles, etc.) rather than
  // reading it in an effect, which would need a setState call directly in
  // the effect body — flagged by react-hooks/set-state-in-effect, and for
  // good reason: it causes an extra cascading render for no benefit here.
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      className="text-muted hover:text-ivory transition-colors"
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}
