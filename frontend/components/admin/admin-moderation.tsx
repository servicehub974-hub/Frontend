"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Users, Flag, ScrollText, Settings2, Ban, ShieldCheck, Check, X } from "lucide-react";
import { api, apiGet } from "@/lib/api";

interface Stat { users: number; creators: number; content: number; posts: number; comments: number; likes: number; views: number; gems_in_circulation: number; orders_pending: number; reports_open: number; vip_active: number; }
interface AUser { id: string; email: string | null; username: string | null; display_name: string | null; role: string; banned: boolean; }
interface Rep { id: string; target_type: string; target_id: string; reason: string | null; preview: { title?: string; thumbnail?: string } | null; created_at: string | null; }

function Stats() {
  const { data } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => apiGet<Stat>("/api/admin/analytics") });
  const cells: [string, number | string][] = data ? [
    ["Users", data.users], ["Creators", data.creators], ["Content", data.content], ["Posts", data.posts],
    ["Comments", data.comments], ["Likes", data.likes], ["Views", data.views], ["Gems", data.gems_in_circulation],
    ["VIP active", data.vip_active], ["Pending orders", data.orders_pending], ["Open reports", data.reports_open],
  ] : [];
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><BarChart3 size={18} className="text-cyan" /> Analytics</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xl font-bold text-white">{typeof v === "number" ? v.toLocaleString() : v}</p>
            <p className="text-xs text-white/40">{k}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => apiGet<AUser[]>("/api/admin/users") });
  const setRole = async (id: string, role: string) => { try { await api(`/api/admin/users/${id}/role`, { method: "PATCH", json: { role } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); } catch { /* */ } };
  const ban = async (id: string, banned: boolean) => { try { await api(`/api/admin/users/${id}/ban`, { method: "POST", json: { banned } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); } catch { /* */ } };
  const list = (data ?? []).filter((u) => `${u.display_name} ${u.username} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Users size={18} className="text-cyan" /> Users</h2>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="mb-3 w-full max-w-sm rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-cyan/50" />
      <div className="flex flex-col gap-2">
        {list.slice(0, 50).map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate text-white">{u.display_name || u.username || u.email} {u.banned && <span className="ml-1 rounded bg-rose/20 px-1.5 text-[10px] text-rose">banned</span>}</span>
            <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none">
              <option value="user">user</option><option value="creator">creator</option><option value="admin">admin</option>
            </select>
            <button onClick={() => ban(u.id, !u.banned)} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${u.banned ? "bg-white/10 text-white" : "bg-rose/20 text-rose"}`}>
              {u.banned ? <><ShieldCheck size={13} /> Unban</> : <><Ban size={13} /> Ban</>}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reports() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-reports"], queryFn: () => apiGet<Rep[]>("/api/admin/reports"), refetchInterval: 20000 });
  const act = async (id: string, kind: "dismiss" | "takedown") => { try { await api(`/api/admin/reports/${id}/${kind}`, { method: "POST" }); qc.invalidateQueries({ queryKey: ["admin-reports"] }); } catch { /* */ } };
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Flag size={18} className="text-rose" /> Reports {data && data.length > 0 && <span className="rounded-full bg-rose px-2 py-0.5 text-xs text-white">{data.length}</span>}</h2>
      {!data || data.length === 0 ? <p className="text-sm text-white/40">No open reports.</p> : (
        <div className="flex flex-col gap-2">
          {data.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              {r.preview?.thumbnail && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.preview.thumbnail} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white"><span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">{r.target_type}</span> {r.preview?.title || r.target_id}</p>
                {r.reason && <p className="text-xs text-white/40">Reason: {r.reason}</p>}
              </div>
              <button onClick={() => act(r.id, "dismiss")} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white"><Check size={13} /> Dismiss</button>
              <button onClick={() => act(r.id, "takedown")} className="flex items-center gap-1 rounded-full bg-rose/20 px-3 py-1.5 text-xs text-rose"><X size={13} /> Take down</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SiteBranding() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-site"], queryFn: () => apiGet<{ name: string; logo_url: string | null; favicon_url: string | null; tagline: string | null }>("/api/site") });
  const [form, setForm] = useState({ name: "", logo_url: "", favicon_url: "", tagline: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (data) setForm({ name: data.name || "", logo_url: data.logo_url || "", favicon_url: data.favicon_url || "", tagline: data.tagline || "" }); }, [data]);
  const save = async () => { try { await api("/api/admin/site", { method: "PUT", json: form }); qc.invalidateQueries({ queryKey: ["site"] }); qc.invalidateQueries({ queryKey: ["admin-site"] }); setSaved(true); setTimeout(() => setSaved(false), 1500); } catch { /* */ } };
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Settings2 size={18} className="text-gold" /> Site branding</h2>
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Site name" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
        <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
        <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="Logo URL" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
        <input value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="Favicon URL" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
        <div className="flex items-center gap-2"><button onClick={save} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Save</button>{saved && <span className="text-sm font-semibold text-green-400">Saved ✓</span>}</div>
      </div>
    </section>
  );
}

function Audit() {
  const { data } = useQuery({ queryKey: ["admin-audit"], queryFn: () => apiGet<{ admin: string; action: string; detail: string | null; at: string | null }[]>("/api/admin/audit") });
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><ScrollText size={18} className="text-white/50" /> Audit log</h2>
      {!data || data.length === 0 ? <p className="text-sm text-white/40">No activity yet.</p> : (
        <div className="flex flex-col divide-y divide-white/5 text-sm">
          {data.map((a, i) => (
            <div key={i} className="flex items-center gap-2 py-2 text-white/70">
              <span className="font-medium text-white">{a.admin}</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">{a.action}</span>
              <span className="min-w-0 flex-1 truncate text-white/40">{a.detail}</span>
              <span className="shrink-0 text-xs text-white/30">{a.at ? new Date(a.at).toLocaleString() : ""}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminModeration() {
  return <><Stats /><Reports /><UsersAdmin /><SiteBranding /><Audit /></>;
}
