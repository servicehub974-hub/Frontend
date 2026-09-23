"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Maximize2, Play, Pause } from "lucide-react";
import { useMiniPlayer } from "@/providers/player-provider";

export function MiniPlayer() {
  const { mini, closeMini, setResume } = useMiniPlayer();
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLVideoElement>(null);
  const timeRef = useRef(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || !mini) return;
    const seek = () => { try { el.currentTime = mini.time || 0; } catch { /* */ } el.play().catch(() => {}); };
    if (el.readyState >= 1) seek();
    else el.addEventListener("loadedmetadata", seek, { once: true });
  }, [mini?.id, mini?.src]);

  if (!mini) return null;
  if (pathname === `/content/${mini.id}`) return null; // full player is showing this video

  const toggle = () => { const el = ref.current; if (!el) return; el.paused ? el.play() : el.pause(); };
  const maximize = () => {
    setResume({ id: mini.id, time: timeRef.current });
    router.push(`/content/${mini.id}`);
  };

  return (
    <div className="fixed bottom-20 right-3 z-[120] w-72 max-w-[86vw] overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl sm:bottom-4 sm:right-4">
      <div className="relative">
        {mini.embed ? (
          <iframe src={mini.src} className="aspect-video w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen title={mini.title || "video"} />
        ) : (
          <video ref={ref} src={mini.src} poster={mini.poster} className="aspect-video w-full bg-black" playsInline autoPlay
            onTimeUpdate={(e) => { timeRef.current = e.currentTarget.currentTime; }}
            onClick={toggle} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        )}
        {!mini.embed && (
          <button onClick={toggle} className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 p-1 text-white">
            {playing ? <Pause size={13} /> : <Play size={13} className="fill-white" />}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button onClick={maximize} className="min-w-0 flex-1 truncate text-left text-xs text-white hover:text-cyan" title="Back to video">{mini.title || "Now playing"}</button>
        <button onClick={maximize} className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white" title="Maximize"><Maximize2 size={14} /></button>
        <button onClick={closeMini} className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-rose" title="Close"><X size={15} /></button>
      </div>
    </div>
  );
}
