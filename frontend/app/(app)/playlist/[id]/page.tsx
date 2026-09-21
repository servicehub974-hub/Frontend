"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListVideo, Trash2, ChevronUp, ChevronDown, Play, Globe, Link2, Lock } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import type { ContentItem } from "@/lib/types";

interface Detail {
  id: string; title: string; description: string | null; visibility: string;
  owner_id: string; owner_name: string; is_owner: boolean; items: ContentItem[];
}

function visIcon(v: string) {
  if (v === "private") return <Lock size={14} />;
  if (v === "unlisted") return <Link2 size={14} />;
  return <Globe size={14} />;
}

export default function PlaylistDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["playlist", id, user?.id ?? "anon"],
    queryFn: () => apiGet<Detail>(`/api/playlists/${id}`),
    retry: false,
  });

  if (isLoading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (isError || !d) return <div className="px-6 py-16 text-center text-white/60">Playlist not found.</div>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["playlist", id] });

  const remove = async (cid: string) => { try { await api(`/api/playlists/${id}/items/${cid}`, { method: "DELETE" }); refresh(); } catch { /* */ } };
  const move = async (idx: number, dir: -1 | 1) => {
    const ids = d.items.map((i) => i.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    try { await api(`/api/playlists/${id}/reorder`, { method: "POST", json: { content_ids: ids } }); refresh(); } catch { /* */ }
  };
  const changeVis = async (v: string) => { try { await api(`/api/playlists/${id}`, { method: "PATCH", json: { visibility: v } }); refresh(); } catch { /* */ } };
  const del = async () => { if (!confirm("Delete this playlist?")) return; try { await api(`/api/playlists/${id}`, { method: "DELETE" }); router.push("/playlists"); } catch { /* */ } };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white"><ListVideo size={22} className="text-cyan" /> {d.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/50">
            <Link href={`/channel/${d.owner_id}`} className="hover:text-white">{d.owner_name}</Link> · {d.items.length} items · <span className="flex items-center gap-1">{visIcon(d.visibility)} {d.visibility}</span>
          </p>
        </div>
        {d.is_owner && (
          <div className="flex items-center gap-2">
            <select value={d.visibility} onChange={(e) => changeVis(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50">
              <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
            </select>
            <button onClick={del} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-rose hover:bg-white/15">Delete</button>
          </div>
        )}
      </div>

      {d.items.length > 0 && (
        <Link href={`/content/${d.items[0].id}`} className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90"><Play size={16} className="fill-black" /> Play all</Link>
      )}

      {d.items.length === 0 ? (
        <p className="text-sm text-white/40">This playlist is empty.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {d.items.map((it, idx) => (
            <div key={it.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5">
              <span className="w-5 text-center text-sm text-white/30">{idx + 1}</span>
              <Link href={`/content/${it.id}`} className="flex flex-1 items-center gap-3">
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-elevated sm:w-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.thumbnail} alt="" className="h-full w-full object-cover" />
                  {it.duration && <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] text-white">{it.duration}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium text-white">{it.title}</h3>
                  <p className="truncate text-xs text-white/50">{it.creator.name} · {it.views} views</p>
                </div>
              </Link>
              {d.is_owner && (
                <div className="flex shrink-0 items-center gap-1 text-white/50">
                  <button onClick={() => move(idx, -1)} className="rounded p-1 hover:bg-white/10 hover:text-white"><ChevronUp size={16} /></button>
                  <button onClick={() => move(idx, 1)} className="rounded p-1 hover:bg-white/10 hover:text-white"><ChevronDown size={16} /></button>
                  <button onClick={() => remove(it.id)} className="rounded p-1 hover:bg-white/10 hover:text-rose"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
