"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Pencil, Trash2, Eye, Heart, MessageCircle, Gem, Lock, Download, MessageSquareOff } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";
import { fmtCount } from "@/lib/format";

interface Item {
  id: string; title: string; thumbnail_url: string | null; content_type: string; is_short: boolean;
  status: string; visibility: string; is_premium: boolean; price_gems: number | null;
  allow_comments: boolean; allow_download: boolean; views: number; like_count: number; comment_count: number;
}

const FILTERS = ["All", "Videos", "Reels", "Photos", "Premium", "Free", "Published", "Private"] as const;

function match(it: Item, f: string) {
  switch (f) {
    case "Videos": return it.content_type === "video" && !it.is_short;
    case "Reels": return it.is_short;
    case "Photos": return it.content_type === "photo";
    case "Premium": return it.is_premium;
    case "Free": return !it.is_premium;
    case "Published": return it.status === "published";
    case "Private": return it.visibility === "private" || it.visibility === "unlisted" || it.status === "draft";
    default: return true;
  }
}

export default function CreatorDashboard() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("All");
  const { data } = useQuery({ queryKey: ["manage"], queryFn: () => apiGet<Item[]>("/api/content/manage"), enabled: !!user });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Log in to manage your content.</div>;

  const patch = async (id: string, body: Record<string, unknown>) => {
    try { await api(`/api/content/${id}`, { method: "PATCH", json: body }); qc.invalidateQueries({ queryKey: ["manage"] }); } catch { /* */ }
  };
  const del = async (id: string) => { if (!confirm("Delete this content?")) return; try { await api(`/api/content/${id}`, { method: "DELETE" }); qc.invalidateQueries({ queryKey: ["manage"] }); } catch { /* */ } };

  const items = (data ?? []).filter((it) => match(it, filter));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader icon={LayoutDashboard} title="Creator Studio" action={<Link href="/upload" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">Upload</Link>} />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === f ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{f}</button>
        ))}
      </div>

      {!data ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/40">Nothing here. <Link href="/upload" className="text-cyan hover:underline">Upload something</Link>.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <div key={it.id} className="glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
              <div className={`relative shrink-0 overflow-hidden rounded-lg bg-elevated ${it.is_short ? "aspect-[9/16] w-16" : "aspect-video w-32"}`}>
                {it.thumbnail_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.thumbnail_url} alt="" className="h-full w-full object-cover" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="line-clamp-1 text-sm font-semibold text-white">{it.title}</h3>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">{it.is_short ? "Reel" : it.content_type}</span>
                  {it.status !== "published" && <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] uppercase text-gold">{it.status}</span>}
                  {it.visibility !== "public" && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">{it.visibility}</span>}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1"><Eye size={13} /> {fmtCount(it.views)}</span>
                  <span className="flex items-center gap-1"><Heart size={13} /> {fmtCount(it.like_count)}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={13} /> {fmtCount(it.comment_count)}</span>
                </div>
                {/* quick controls */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select value={it.visibility} onChange={(e) => patch(it.id, { visibility: e.target.value })} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none">
                    <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
                  </select>
                  <button onClick={() => patch(it.id, { is_premium: !it.is_premium, price_gems: it.is_premium ? null : (it.price_gems || 50) })} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${it.is_premium ? "bg-fuchsia/20 text-fuchsia" : "bg-white/5 text-white/50"}`}><Lock size={12} /> {it.is_premium ? "Premium" : "Free"}</button>
                  {it.is_premium && (
                    <span className="flex items-center gap-1 text-xs text-white/60">
                      <Gem size={12} className="text-gold" />
                      <input type="number" defaultValue={it.price_gems ?? 0} onBlur={(e) => Number(e.target.value) !== it.price_gems && patch(it.id, { price_gems: Number(e.target.value) })} className="w-16 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white outline-none" />
                    </span>
                  )}
                  <button onClick={() => patch(it.id, { allow_comments: !it.allow_comments })} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${it.allow_comments ? "bg-white/5 text-white/50" : "bg-rose/20 text-rose"}`}><MessageSquareOff size={12} /> {it.allow_comments ? "Comments on" : "Comments off"}</button>
                  <button onClick={() => patch(it.id, { allow_download: !it.allow_download })} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${it.allow_download ? "bg-cyan/20 text-cyan" : "bg-white/5 text-white/50"}`}><Download size={12} /> {it.allow_download ? "Download on" : "Download off"}</button>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/content/${it.id}/edit`} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"><Pencil size={13} /> Edit</Link>
                <button onClick={() => del(it.id)} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-rose"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
