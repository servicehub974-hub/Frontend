"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListVideo, Plus, Globe, Link2, Lock } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PL { id: string; title: string; visibility: string; item_count: number; thumbnail: string | null; }

function visIcon(v: string) {
  if (v === "private") return <Lock size={13} />;
  if (v === "unlisted") return <Link2 size={13} />;
  return <Globe size={13} />;
}

export default function PlaylistsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [vis, setVis] = useState("public");
  const [creating, setCreating] = useState(false);

  const { data } = useQuery({ queryKey: ["playlists-mine"], queryFn: () => apiGet<PL[]>("/api/playlists/mine"), enabled: !!user });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Log in to manage your playlists.</div>;

  const create = async () => {
    if (!title.trim()) return;
    try { await api("/api/playlists", { method: "POST", json: { title: title.trim(), visibility: vis } }); setTitle(""); setCreating(false); qc.invalidateQueries({ queryKey: ["playlists-mine"] }); } catch { /* */ }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white"><ListVideo size={24} className="text-cyan" /> Playlists</h1>
        <Button size="sm" onClick={() => setCreating((v) => !v)}><Plus size={16} /> New</Button>
      </div>

      {creating && (
        <div className="mb-6 flex flex-wrap items-end gap-3 glass-panel rounded-xl p-4">
          <div className="min-w-[200px] flex-1"><Input id="t" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} /></div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Visibility</label>
            <select value={vis} onChange={(e) => setVis(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50">
              <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
            </select>
          </div>
          <Button onClick={create}>Create</Button>
        </div>
      )}

      {!data || data.length === 0 ? (
        <p className="text-sm text-white/40">No playlists yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((pl) => (
            <Link key={pl.id} href={`/playlist/${pl.id}`} className="group">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-elevated">
                {pl.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pl.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                )}
                <div className="absolute bottom-0 right-0 flex items-center gap-1 bg-black/70 px-2 py-1 text-[11px] text-white"><ListVideo size={12} /> {pl.item_count}</div>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <h3 className="line-clamp-1 flex-1 text-sm font-medium text-white">{pl.title}</h3>
                <span className="text-white/40">{visIcon(pl.visibility)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
