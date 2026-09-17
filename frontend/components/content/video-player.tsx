"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Pause, Volume2, Volume1, VolumeX, Settings, Maximize, Minimize,
  SkipForward, Lock, Unlock, RotateCcw, RotateCw, Clock, Gauge, MonitorPlay, ChevronRight, ChevronLeft, Check,
  Repeat, PictureInPicture, Link as LinkIcon,
} from "lucide-react";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP = [0, 15, 30, 60]; // minutes; 0 = off

function fmt(t: number) {
  if (!isFinite(t) || t < 0) return "0:00";
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

type Menu = "none" | "main" | "speed" | "quality" | "sleep";

export function VideoPlayer({ src, poster, onNext }: { src: string; poster?: string; onNext?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [menu, setMenu] = useState<Menu>("none");
  const [sleep, setSleep] = useState(0);
  const [flash, setFlash] = useState<{ dir: "fwd" | "back"; n: number } | null>(null);
  const [scrubT, setScrubT] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [copied, setCopied] = useState(false);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const v = () => videoRef.current;

  const togglePlay = useCallback(() => { const el = v(); if (el) (el.paused ? el.play() : el.pause()); }, []);
  const seekBy = useCallback((d: number) => {
    const el = v(); if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + d), el.duration || 0);
    setFlash({ dir: d > 0 ? "fwd" : "back", n: Math.abs(d) });
    setTimeout(() => setFlash(null), 500);
  }, []);
  const seekTo = useCallback((t: number) => { const el = v(); if (el) el.currentTime = Math.min(Math.max(0, t), el.duration || 0); }, []);
  const setVol = useCallback((val: number) => {
    const el = v(); if (!el) return;
    const nv = Math.min(1, Math.max(0, val)); el.volume = nv; el.muted = nv === 0; setVolume(nv); setMuted(nv === 0);
  }, []);
  const changeSpeed = useCallback((s: number) => { const el = v(); if (el) el.playbackRate = s; setSpeed(s); }, []);
  const toggleLoop = useCallback(() => { const el = v(); if (el) { el.loop = !el.loop; setLoop(el.loop); } }, []);
  const togglePiP = useCallback(async () => {
    const el = v(); if (!el) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (el.requestPictureInPicture) await el.requestPictureInPicture();
    } catch { /* unsupported */ }
  }, []);
  const copyUrl = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }).catch(() => {});
  }, []);
  const toggleFull = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.().catch(() => {});
  }, []);
  const flashUI = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (!v()?.paused && menu === "none") setShowUI(false); }, 3000);
  }, [menu]);

  // sleep timer
  const setSleepTimer = (min: number) => {
    setSleep(min); setMenu("none");
    if (sleepRef.current) clearTimeout(sleepRef.current);
    if (min > 0) sleepRef.current = setTimeout(() => v()?.pause(), min * 60000);
  };

  useEffect(() => {
    const el = v(); if (!el) return;
    const onT = () => setCurrent(el.currentTime);
    const onD = () => setDuration(el.duration || 0);
    const onP = () => { try { setBuffered(el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0); } catch { /* */ } };
    const onPl = () => { setPlaying(true); flashUI(); };
    const onPa = () => { setPlaying(false); setShowUI(true); };
    const onE = () => { setPlaying(false); onNext?.(); };
    el.addEventListener("timeupdate", onT); el.addEventListener("loadedmetadata", onD);
    el.addEventListener("progress", onP); el.addEventListener("play", onPl);
    el.addEventListener("pause", onPa); el.addEventListener("ended", onE);
    return () => { el.removeEventListener("timeupdate", onT); el.removeEventListener("loadedmetadata", onD); el.removeEventListener("progress", onP); el.removeEventListener("play", onPl); el.removeEventListener("pause", onPa); el.removeEventListener("ended", onE); };
  }, [flashUI, onNext]);

  useEffect(() => { const f = () => setFull(!!document.fullscreenElement); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);

  // ---- keyboard (global while player is on the page; ignores typing) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lockedRef.current) return;
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT" || ae.isContentEditable)) return;
      const el = videoRef.current;
      if (!el) return;
      const k = e.key, kl = k.toLowerCase();
      const handled = [" ", "k", "j", "l", "m", "f", "i", "arrowleft", "arrowright", "arrowup", "arrowdown", "home", "end", ",", "."].includes(kl) || /^[0-9]$/.test(k) || k === "<" || k === ">";
      if (!handled) return;
      e.preventDefault();
      if (kl === " " || kl === "k") togglePlay();
      else if (kl === "j") seekBy(-10);
      else if (kl === "l") seekBy(10);
      else if (kl === "arrowleft") seekBy(-5);
      else if (kl === "arrowright") seekBy(5);
      else if (kl === "arrowup") setVol(el.volume + 0.05);
      else if (kl === "arrowdown") setVol(el.volume - 0.05);
      else if (kl === "m") { el.muted = !el.muted; setMuted(el.muted); }
      else if (kl === "f") toggleFull();
      else if (kl === "i") togglePiP();
      else if (kl === "home") seekTo(0);
      else if (kl === "end") seekTo(el.duration);
      else if (k === "<") { const i = SPEEDS.indexOf(el.playbackRate); changeSpeed(SPEEDS[Math.max(0, (i < 0 ? 3 : i) - 1)]); }
      else if (k === ">") { const i = SPEEDS.indexOf(el.playbackRate); changeSpeed(SPEEDS[Math.min(SPEEDS.length - 1, (i < 0 ? 3 : i) + 1)]); }
      else if (k === "," && el.paused) seekTo(el.currentTime - 1 / 30);
      else if (k === "." && el.paused) seekTo(el.currentTime + 1 / 30);
      else if (/^[0-9]$/.test(k) && el.duration) seekTo((parseInt(k) / 10) * el.duration);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, seekTo, setVol, changeSpeed, toggleFull, togglePiP]);

  // ---- touch gestures ----
  const touch = useRef<{ x: number; y: number; t: number; startTime: number; mode: "" | "scrub" } | null>(null);
  const lastTap = useRef<{ t: number; side: "l" | "r" | "c"; count: number }>({ t: 0, side: "c", count: 0 });

  const onTouchStart = (e: React.TouchEvent) => {
    if (locked) return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), startTime: v()?.currentTime ?? 0, mode: "" };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (locked || !touch.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
    if (touch.current.mode === "scrub" || (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy))) {
      touch.current.mode = "scrub";
      const rect = wrapRef.current?.getBoundingClientRect(); const el = v();
      if (rect && el?.duration) {
        const nt = Math.min(el.duration, Math.max(0, touch.current.startTime + (dx / rect.width) * el.duration));
        setScrubT(nt);
      }
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (locked || !touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y, dt = Date.now() - touch.current.t;

    if (touch.current.mode === "scrub") {
      if (scrubT != null) seekTo(scrubT);
      setScrubT(null); touch.current = null; return;
    }
    // vertical swipe
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) && dt < 500) {
      if (dy < 0) onNext?.(); else toggleFull();
      touch.current = null; return;
    }
    // tap / double-tap
    if (dt < 250 && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const rect = wrapRef.current?.getBoundingClientRect();
      const rel = rect ? (t.clientX - rect.left) / rect.width : 0.5;
      const side: "l" | "r" | "c" = rel < 0.35 ? "l" : rel > 0.65 ? "r" : "c";
      const now = Date.now();
      const dbl = now - lastTap.current.t < 300 && lastTap.current.side === side;
      if (dbl && side === "l") { const n = lastTap.current.count + 1; lastTap.current = { t: now, side, count: n }; seekBy(-10); }
      else if (dbl && side === "r") { const n = lastTap.current.count + 1; lastTap.current = { t: now, side, count: n }; seekBy(10); }
      else if (dbl && side === "c") { lastTap.current = { t: 0, side: "c", count: 0 }; togglePlay(); }
      else { lastTap.current = { t: now, side, count: 1 }; setShowUI((s) => !s); }
    }
    touch.current = null;
  };

  const scrubBar = (clientX: number) => { const el = v(), rect = barRef.current?.getBoundingClientRect(); if (el && rect && el.duration) el.currentTime = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * el.duration; };

  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div ref={wrapRef} onMouseMove={flashUI} onContextMenu={(e) => { e.preventDefault(); if (!locked) setMenu("main"); }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      className="group relative aspect-video w-full select-none overflow-hidden bg-black outline-none sm:rounded-xl">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} src={src} poster={poster} playsInline className="h-full w-full"
        onClick={() => !locked && togglePlay()} onDoubleClick={() => !locked && toggleFull()} />

      {/* seek flash */}
      {flash && (
        <div className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-black/60 px-4 py-3 text-white ${flash.dir === "fwd" ? "right-8" : "left-8"}`}>
          {flash.dir === "fwd" ? <RotateCw size={22} /> : <RotateCcw size={22} />} {flash.n}s
        </div>
      )}
      {/* scrub bubble */}
      {scrubT != null && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/70 px-4 py-2 text-lg font-semibold text-white">
          {fmt(scrubT)} / {fmt(duration)}
        </div>
      )}
      {copied && (
        <div className="absolute bottom-16 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">Link copied</div>
      )}

      {locked ? (
        <button onClick={() => setLocked(false)} className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur">
          <Unlock size={16} /> Unlock
        </button>
      ) : (
        <>
          {!playing && scrubT == null && (
            <button onClick={togglePlay} className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"><Play size={30} className="ml-1 fill-white" /></span>
            </button>
          )}

          {/* settings menu */}
          {menu !== "none" && (
            <div className="absolute bottom-16 right-3 z-30 w-56 overflow-hidden rounded-xl bg-black/90 text-sm text-white backdrop-blur" onClick={(e) => e.stopPropagation()}>
              {menu === "main" && (
                <>
                  <button onClick={() => setMenu("sleep")} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10"><Clock size={18} /> <span className="flex-1 text-left">Sleep timer</span><span className="text-white/50">{sleep ? `${sleep}m` : "Off"}</span><ChevronRight size={16} /></button>
                  <button onClick={() => setMenu("speed")} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10"><Gauge size={18} /> <span className="flex-1 text-left">Playback speed</span><span className="text-white/50">{speed === 1 ? "Normal" : `${speed}x`}</span><ChevronRight size={16} /></button>
                  <button onClick={() => setMenu("quality")} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10"><MonitorPlay size={18} /> <span className="flex-1 text-left">Quality</span><span className="text-white/50">Auto</span><ChevronRight size={16} /></button>
                  <div className="my-1 h-px bg-white/10" />
                  <button onClick={toggleLoop} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10"><Repeat size={18} /> <span className="flex-1 text-left">Loop</span><span className={loop ? "text-cyan" : "text-white/50"}>{loop ? "On" : "Off"}</span></button>
                  <button onClick={() => { togglePiP(); setMenu("none"); }} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10"><PictureInPicture size={18} /> <span className="flex-1 text-left">Miniplayer</span></button>
                  <button onClick={() => { copyUrl(); setMenu("none"); }} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10"><LinkIcon size={18} /> <span className="flex-1 text-left">Copy video URL</span></button>
                </>
              )}
              {menu === "speed" && (
                <>
                  <button onClick={() => setMenu("main")} className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-3 font-medium"><ChevronLeft size={16} /> Playback speed</button>
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => { changeSpeed(s); setMenu("none"); }} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"><span className="w-4">{speed === s && <Check size={16} className="text-cyan" />}</span>{s === 1 ? "Normal" : `${s}x`}</button>
                  ))}
                </>
              )}
              {menu === "sleep" && (
                <>
                  <button onClick={() => setMenu("main")} className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-3 font-medium"><ChevronLeft size={16} /> Sleep timer</button>
                  {SLEEP.map((m) => (
                    <button key={m} onClick={() => setSleepTimer(m)} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"><span className="w-4">{sleep === m && <Check size={16} className="text-cyan" />}</span>{m === 0 ? "Off" : `${m} minutes`}</button>
                  ))}
                </>
              )}
              {menu === "quality" && (
                <>
                  <button onClick={() => setMenu("main")} className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-3 font-medium"><ChevronLeft size={16} /> Quality</button>
                  <button className="flex w-full items-center gap-3 px-4 py-2.5"><Check size={16} className="text-cyan" /> Auto</button>
                  <p className="px-4 pb-3 text-xs text-white/30">Multiple qualities arrive with HLS (Phase 4).</p>
                </>
              )}
            </div>
          )}

          {/* controls bar */}
          <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 ${showUI || menu !== "none" ? "opacity-100" : "opacity-0"}`}>
            <div ref={barRef}
              onPointerDown={(e) => { scrubBar(e.clientX); const mv = (ev: PointerEvent) => scrubBar(ev.clientX); const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }; window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); }}
              className="group/bar relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/25">
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/40" style={{ width: `${bufPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-rose" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-rose opacity-0 transition-opacity group-hover/bar:opacity-100" style={{ left: `calc(${pct}% - 7px)` }} />
            </div>
            <div className="flex items-center gap-3 text-white">
              <button onClick={togglePlay} aria-label="Play/pause">{playing ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white" />}</button>
              <button onClick={() => onNext?.()} className={onNext ? "" : "opacity-30"} aria-label="Next"><SkipForward size={20} className="fill-white" /></button>
              <div className="group/vol flex items-center gap-1">
                <button onClick={() => setVol(muted ? volume || 1 : 0)} aria-label="Mute"><VolIcon size={20} /></button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => setVol(parseFloat(e.target.value))} className="h-1 w-0 cursor-pointer accent-white transition-all group-hover/vol:w-16" />
              </div>
              <span className="text-xs font-medium tabular-nums">{fmt(current)} / {fmt(duration)}</span>
              <div className="ml-auto flex items-center gap-3">
                <button onClick={() => setMenu(menu === "none" ? "main" : "none")} aria-label="Settings"><Settings size={19} className={menu !== "none" ? "text-cyan" : ""} /></button>
                <button onClick={() => setLocked(true)} aria-label="Lock"><Lock size={18} /></button>
                <button onClick={toggleFull} aria-label="Fullscreen">{full ? <Minimize size={19} /> : <Maximize size={19} />}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
