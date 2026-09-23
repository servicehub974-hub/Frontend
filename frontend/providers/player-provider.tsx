"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface MiniState { id: string; src: string; poster?: string; title?: string; time: number; embed?: boolean; }
export interface ResumeState { id: string; time: number; }

interface Ctx {
  mini: MiniState | null;
  openMini: (m: MiniState) => void;
  closeMini: () => void;
  resume: ResumeState | null;
  setResume: (r: ResumeState) => void;
  clearResume: () => void;
}

const PlayerCtx = createContext<Ctx>({
  mini: null, openMini: () => {}, closeMini: () => {},
  resume: null, setResume: () => {}, clearResume: () => {},
});

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [mini, setMini] = useState<MiniState | null>(null);
  const [resume, setResumeState] = useState<ResumeState | null>(null);
  const openMini = useCallback((m: MiniState) => setMini(m), []);
  const closeMini = useCallback(() => setMini(null), []);
  const setResume = useCallback((r: ResumeState) => setResumeState(r), []);
  const clearResume = useCallback(() => setResumeState(null), []);
  return (
    <PlayerCtx.Provider value={{ mini, openMini, closeMini, resume, setResume, clearResume }}>
      {children}
    </PlayerCtx.Provider>
  );
}

export const useMiniPlayer = () => useContext(PlayerCtx);
