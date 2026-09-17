"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Pause, Volume2, Volume1, VolumeX, Settings, Maximize, Minimize,
  SkipForward, Lock, Unlock, RotateCcw, RotateCw,
} from "lucide-react";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  poster,
  onNext,
}: {
  src: string;
  poster?: string;
  onNext?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [full, setFull] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [settings, setSettings] = useState(false);
  const [seekFlash, setSeekFlash] = useState<"fwd" | "back" | null>(null);

  const v = () => videoRef.current;

  const togglePlay = useCallback(() => {
    const el = v();
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }, []);

  const seek = useCallback((delta: number) => {
    const el = v();
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + delta), el.duration || 0);
    setSeekFlash(delta > 0 ? "fwd" : "back");
    setTimeout(() => setSeekFlash(null), 400);
  }, []);

  const setVol = useCallback((val: number) => {
    const el = v();
    if (!el) return;
    const nv = Math.min(1, Math.max(0, val));
    el.volume = nv; el.muted = nv === 0; setVolume(nv); setMuted(nv === 0);
  }, []);

  const toggleFull = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }, []);

  const flashUI = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (!v()?.paused) setShowUI(false); }, 3000);
  }, []);

  // media events
  useEffect(() => {
    const el = v();
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onDur = () => setDuration(el.duration || 0);
    const onProg = () => { try { setBuffered(el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0); } catch { /* */ } };
    const onPlay = () => { setPlaying(true); flashUI(); };
    const onPause = () => { setPlaying(false); setShowUI(true); };
    const onEnd = () => { setPlaying(false); onNext?.(); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("progress", onProg);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("progress", onProg);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
    };
  }, [flashUI, onNext]);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // keyboard shortcuts (scoped to the player)
  const onKey = (e: React.KeyboardEvent) => {
    if (locked) return;
    const key = e.key.toLowerCase();
    if ([" ", "k", "j", "l", "m", "f", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) e.preventDefault();
    if (key === " " || key === "k") togglePlay();
    else if (key === "j") seek(-10);
    else if (key === "l") seek(10);
    else if (key === "arrowleft") seek(-5);
    else if (key === "arrowright") seek(5);
    else if (key === "arrowup") setVol(volume + 0.1);
    else if (key === "arrowdown") setVol(volume - 0.1);
    else if (key === "m") { const el = v(); if (el) { el.muted = !el.muted; setMuted(el.muted); } }
    else if (key === "f") toggleFull();
    else if (/^[0-9]$/.test(key)) { const el = v(); if (el && el.duration) el.currentTime = (parseInt(key) / 10) * el.duration; }
  };

  const changeSpeed = (s: number) => { const el = v(); if (el) el.playbackRate = s; setSpeed(s); setSettings(false); };

  // mobile gestures
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (locked || !touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const dt = Date.now() - touch.current.t;
    // swipe
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) onNext?.();            // swipe up → next
      else toggleFull();                 // swipe down → immersive/fullscreen
      return;
    }
    // double-tap seek
    if (dt < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) {
        const rel = (t.clientX - rect.left) / rect.width;
        if (rel < 0.35) seek(-10);
        else if (rel > 0.65) seek(10);
        else togglePlay();
      }
    }
    touch.current = null;
    flashUI();
  };

  // progress scrubbing
  const barRef = useRef<HTMLDivElement>(null);
  const scrub = (clientX: number) => {
    const el = v(); const rect = barRef.current?.getBoundingClientRect();
    if (!el || !rect || !el.duration) return;
    el.currentTime = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * el.duration;
  };

  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={flashUI}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="group relative aspect-video w-full select-none overflow-hidden bg-black outline-none sm:rounded-xl"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full"
        onClick={() => !locked && togglePlay()}
        playsInline
      />

      {/* seek flash */}
      {seekFlash && (
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-black/60 px-4 py-3 text-white ${seekFlash === "fwd" ? "right-8" : "left-8"}`}>
          {seekFlash === "fwd" ? <RotateCw size={22} /> : <RotateCcw size={22} />} 10s
        </div>
      )}

      {/* locked overlay */}
      {locked ? (
        <button onClick={() => setLocked(false)}
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur">
          <Unlock size={16} /> Unlock
        </button>
      ) : (
        <>
          {/* center play */}
          {!playing && (
            <button onClick={togglePlay} className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md">
                <Play size={30} className="ml-1 fill-white" />
              </span>
            </button>
          )}

          {/* controls */}
          <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 ${showUI ? "opacity-100" : "opacity-0"}`}>
            {/* progress */}
            <div
              ref={barRef}
              onPointerDown={(e) => { scrub(e.clientX); const mv = (ev: PointerEvent) => scrub(ev.clientX); const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }; window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); }}
              className="group/bar relative mb-2 h-1 w-full cursor-pointer rounded-full bg-white/25"
            >
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/40" style={{ width: `${bufPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-rose" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-rose opacity-0 transition-opacity group-hover/bar:opacity-100" style={{ left: `calc(${pct}% - 6px)` }} />
            </div>

            <div className="flex items-center gap-3 text-white">
              <button onClick={togglePlay}>{playing ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white" />}</button>
              <button onClick={() => onNext?.()} className={onNext ? "" : "opacity-30"}><SkipForward size={20} className="fill-white" /></button>

              <div className="group/vol flex items-center gap-1">
                <button onClick={() => setVol(muted ? (volume || 1) : 0)}><VolIcon size={20} /></button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => setVol(parseFloat(e.target.value))}
                  className="h-1 w-0 cursor-pointer accent-white transition-all group-hover/vol:w-16" />
              </div>

              <span className="text-xs font-medium tabular-nums">{fmt(current)} / {fmt(duration)}</span>

              <div className="ml-auto flex items-center gap-3">
                <div className="relative">
                  <button onClick={() => setSettings((s) => !s)}><Settings size={19} /></button>
                  {settings && (
                    <div className="absolute bottom-9 right-0 w-36 rounded-xl bg-black/90 p-2 text-sm backdrop-blur">
                      <p className="px-2 pb-1 text-xs text-white/40">Playback speed</p>
                      {SPEEDS.map((s) => (
                        <button key={s} onClick={() => changeSpeed(s)}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/10 ${speed === s ? "text-cyan" : "text-white/80"}`}>
                          {s === 1 ? "Normal" : `${s}x`}{speed === s && " ✓"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setLocked(true)} title="Lock"><Lock size={18} /></button>
                <button onClick={toggleFull}>{full ? <Minimize size={19} /> : <Maximize size={19} />}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
