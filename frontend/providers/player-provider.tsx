"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface MiniState { id: string; src: string; poster?: string; title?: string; time: number; embed?: boolean; }

interface Ctx { mini: MiniState | null; openMini: (m: MiniState) => void; closeMini: () => void; }

const PlayerCtx = createContext<Ctx>({ mini: null, openMini: () => {}, closeMini: () => {} });

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [mini, setMini] = useState<MiniState | null>(null);
  const openMini = useCallback((m: MiniState) => setMini(m), []);
  const closeMini = useCallback(() => setMini(null), []);
  return <PlayerCtx.Provider value={{ mini, openMini, closeMini }}>{children}</PlayerCtx.Provider>;
}

export const useMiniPlayer = () => useContext(PlayerCtx);
