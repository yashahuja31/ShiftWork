'use client';

import { useState } from 'react';
import { Copy, Check, Download, MessageCircle, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  runId: string;
  shareText: string; // e.g. "94% compatible — Trauma Surgeon | Shiftwork"
}

const buttonClass =
  'flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs font-mono text-ivory hover:border-vital/50 transition-colors';

export function ShareButtons({ runId, shareText }: ShareButtonsProps) {
  // Lazy initializer instead of an effect + setState — same reasoning as
  // SoundToggle.tsx: window.location isn't available during SSR, but
  // reading it directly on first render (server gets '', client gets the
  // real origin on hydration) avoids needing a setState call inside a
  // useEffect body entirely.
  const [origin] = useState<string>(() => (typeof window !== 'undefined' ? window.location.origin : ''));
  const [copied, setCopied] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'error'>('idle');

  const shareUrl = origin ? `${origin}/share/${runId}` : '';
  const imageUrl = origin ? `${origin}/api/og/${runId}` : '';

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be blocked by browser permissions — fail quietly,
      // the link is still visible/copyable by hand from the address bar.
    }
  }

  async function handleDownload() {
    if (!imageUrl) return;
    setDownloadState('downloading');
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `shiftwork-${runId}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      setDownloadState('idle');
    } catch {
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 2000);
    }
  }

  if (!origin) return null; // avoids rendering dead links for the one frame before hydration

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <a href={twitterHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        <Share2 size={14} />
        Share on X
      </a>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        <MessageCircle size={14} />
        WhatsApp
      </a>
      <button type="button" onClick={handleDownload} className={buttonClass}>
        <Download size={14} />
        {downloadState === 'downloading' ? 'Downloading…' : downloadState === 'error' ? "Couldn't download" : 'Download image'}
      </button>
      <button type="button" onClick={handleCopy} className={buttonClass}>
        {copied ? <Check size={14} className="text-vital" /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
