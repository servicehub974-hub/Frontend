"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

export function MergeGuestPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || typeof document === "undefined") return;
    const hasAnon = document.cookie.split("; ").some((c) => c.startsWith("nexus_anon="));
    const seen = localStorage.getItem("merge_seen");
    if (hasAnon && !seen) setShow(true);
  }, [user]);

  if (!show) return null;

  const merge = async () => {
    setBusy(true);
    try { await api("/api/users/merge-anon", { method: "POST" }); } catch { /* */ }
    localStorage.setItem("merge_seen", "1");
    setShow(false);
  };
  const fresh = () => {
    document.cookie = "nexus_anon=; Max-Age=0; path=/";
    localStorage.setItem("merge_seen", "1");
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyan/20 bg-cyan/10">
          <Sparkles size={22} className="text-cyan" />
        </div>
        <h2 className="text-lg font-bold text-white">Bring your guest activity?</h2>
        <p className="mt-2 text-sm text-white/60">
          You liked and commented while browsing as a guest. Merge that into this account?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={merge} disabled={busy}
            className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
            {busy ? "Merging…" : "Merge activity"}
          </button>
          <button onClick={fresh} className="w-full rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
}
