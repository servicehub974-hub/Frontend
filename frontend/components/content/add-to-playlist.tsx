"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Check, Globe, Link2, Lock } from "lucide-react";
import { api, apiGet } from "@/lib/api";

interface PL { id: string; title: string; visibility: string; item_count: number; contains: boolean; }

function visIcon(v: string) {
  if (v === "private") return <Lock size={13} className="text-white/40" />;
  if (v === "unlisted") return <Link2 size={13} className="text-white/40" />;
  return <Globe size={13} className="text-white/40" />;
}

export function AddToPlaylist({ contentId, open, onClose }: { contentId: string; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const { data } = useQuery({
    queryKey: ["playlists-mine", contentId],
    queryFn: () => apiGet<PL[]>(`/api/playlists/mine?content_id=${contentId}`),
    enabled: open,
  });

  if (!open) return null;

  const refresh = () => qc.invalidateQueries({ queryKey: ["playlists-mine", contentId] });

  const toggle = async (pl: PL) => {
    try {
      if (pl.contains) await api(`/api/playlists/${pl.id}/items/${contentId}`, { method: "DELETE" });
      else await api(`/api/playlists/${pl.id}/items`, { method: "POST", json: { content_id: contentId } });
      refresh();
    } catch { /* */ }
  };
  const create = async () => {
    if (!title.trim()) return;
    try {
      const pl = await api<{ id: string }>("/api/playlists", { method: "POST", json: { title: title.trim(), visibility: "private" } });
      await api(`/api/playlists/${pl.id}/items`, { method: "POST", json: { content_id: contentId } });
      setTitle(""); setCreating(false); refresh();
    } catch { /* */ }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Save to playlist</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto hide-scrollbar">
          {!data ? (
            <p className="px-1 py-2 text-sm text-white/40">Loading…</p>
          ) : data.length === 0 ? (
            <p className="px-1 py-2 text-sm text-white/40">No playlists yet.</p>
          ) : (
            data.map((pl) => (
              <button key={pl.id} onClick={() => toggle(pl)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5">
                <span className={`flex h-5 w-5 items-center justify-center rounded border ${pl.contains ? "border-cyan bg-cyan/20" : "border-white/20"}`}>
                  {pl.contains && <Check size={14} className="text-cyan" />}
                </span>
                <span className="flex-1 truncate text-sm text-white/90">{pl.title}</span>
                {visIcon(pl.visibility)}
              </button>
            ))
          )}
        </div>

        <div className="mt-3 border-t border-white/5 pt-3">
          {creating ? (
            <div className="flex gap-2">
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="Playlist name" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
              <button onClick={create} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black">Create</button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="flex items-center gap-2 text-sm text-cyan hover:underline"><Plus size={16} /> New playlist</button>
          )}
        </div>
      </div>
    </div>
  );
}
