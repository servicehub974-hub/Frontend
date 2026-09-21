"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Gem, Trash2, Plus } from "lucide-react";
import { api, apiGet } from "@/lib/api";

interface Tier { tier: string; rank: number; price_gems: number | null; price_usd: number | null; duration_days: number | null; daily_gems: number; benefits: string[]; active: boolean; }
interface Pkg { id: string; label: string; gems: number; price_usd: number; active: boolean; sort: number; }

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

function TierCard({ t, onChange }: { t: Tier; onChange: () => void }) {
  const [pg, setPg] = useState(t.price_gems?.toString() ?? "");
  const [pu, setPu] = useState(t.price_usd?.toString() ?? "");
  const [dd, setDd] = useState(t.duration_days?.toString() ?? "");
  const [dg, setDg] = useState(t.daily_gems.toString());
  const [rank, setRank] = useState(t.rank.toString());
  const [benefits, setBenefits] = useState(t.benefits.join("\n"));
  const [active, setActive] = useState(t.active);

  const save = async () => {
    await api(`/api/admin/vip-tiers/${t.tier}`, { method: "PUT", json: {
      price_gems: numOrNull(pg), price_usd: numOrNull(pu), duration_days: numOrNull(dd),
      daily_gems: Number(dg) || 0, rank: Number(rank) || 0,
      benefits: benefits.split("\n").map((b) => b.trim()).filter(Boolean), active,
    } });
    onChange();
  };
  const del = async () => { if (!confirm(`Delete tier "${t.tier}"?`)) return; await api(`/api/admin/vip-tiers/${t.tier}`, { method: "DELETE" }); onChange(); };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold capitalize text-white">{t.tier}</span>
        <label className="flex items-center gap-1 text-xs text-white/50"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> active</label>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        <label className="flex flex-col gap-0.5 text-white/40">Gems price<input value={pg} onChange={(e) => setPg(e.target.value)} placeholder="—" className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white" /></label>
        <label className="flex flex-col gap-0.5 text-white/40">USD price<input value={pu} onChange={(e) => setPu(e.target.value)} placeholder="—" className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white" /></label>
        <label className="flex flex-col gap-0.5 text-white/40">Duration (days)<input value={dd} onChange={(e) => setDd(e.target.value)} placeholder="lifetime" className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white" /></label>
        <label className="flex flex-col gap-0.5 text-white/40">Daily gems<input value={dg} onChange={(e) => setDg(e.target.value)} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white" /></label>
        <label className="flex flex-col gap-0.5 text-white/40">Rank<input value={rank} onChange={(e) => setRank(e.target.value)} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white" /></label>
      </div>
      <label className="mt-2 flex flex-col gap-0.5 text-xs text-white/40">Benefits (one per line)
        <textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={3} className="resize-none rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white" />
      </label>
      <div className="mt-2 flex gap-2">
        <button onClick={save} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black">Save</button>
        <button onClick={del} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-rose"><Trash2 size={13} /> Delete</button>
      </div>
    </div>
  );
}

export function MonetizationAdmin() {
  const qc = useQueryClient();
  const tiers = useQuery({ queryKey: ["admin-vip-tiers"], queryFn: () => apiGet<Tier[]>("/api/admin/vip-tiers") });
  const pkgs = useQuery({ queryKey: ["admin-gem-packages"], queryFn: () => apiGet<Pkg[]>("/api/admin/gem-packages") });
  const refetchTiers = () => qc.invalidateQueries({ queryKey: ["admin-vip-tiers"] });
  const refetchPkgs = () => qc.invalidateQueries({ queryKey: ["admin-gem-packages"] });

  const [nt, setNt] = useState({ tier: "", price_gems: "", duration_days: "30", daily_gems: "0" });
  const addTier = async () => {
    if (!nt.tier.trim()) return;
    await api("/api/admin/vip-tiers", { method: "POST", json: {
      tier: nt.tier.trim().toLowerCase(), price_gems: numOrNull(nt.price_gems),
      duration_days: numOrNull(nt.duration_days), daily_gems: Number(nt.daily_gems) || 0, benefits: [], active: true, rank: (tiers.data?.length ?? 0) + 1,
    } });
    setNt({ tier: "", price_gems: "", duration_days: "30", daily_gems: "0" }); refetchTiers();
  };

  const [np, setNp] = useState({ label: "", gems: "", price_usd: "" });
  const addPkg = async () => {
    if (!np.gems || !np.price_usd) return;
    await api("/api/admin/gem-packages", { method: "POST", json: { label: np.label.trim() || `${np.gems} Gems`, gems: Number(np.gems), price_usd: Number(np.price_usd), sort: (pkgs.data?.length ?? 0) + 1, active: true } });
    setNp({ label: "", gems: "", price_usd: "" }); refetchPkgs();
  };
  const savePkg = async (p: Pkg, patch: Partial<Pkg>) => { await api(`/api/admin/gem-packages/${p.id}`, { method: "PUT", json: patch }); refetchPkgs(); };
  const delPkg = async (id: string) => { if (!confirm("Delete package?")) return; await api(`/api/admin/gem-packages/${id}`, { method: "DELETE" }); refetchPkgs(); };

  return (
    <>
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Crown size={18} className="text-fuchsia" /> VIP tiers</h2>
        <div className="flex flex-col gap-3">
          {tiers.data?.map((t) => <TierCard key={t.tier} t={t} onChange={refetchTiers} />)}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-white/10 p-3">
          <input value={nt.tier} onChange={(e) => setNt({ ...nt, tier: e.target.value })} placeholder="new tier name" className="w-32 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <input value={nt.price_gems} onChange={(e) => setNt({ ...nt, price_gems: e.target.value })} placeholder="gems price" className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <input value={nt.duration_days} onChange={(e) => setNt({ ...nt, duration_days: e.target.value })} placeholder="days" className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <input value={nt.daily_gems} onChange={(e) => setNt({ ...nt, daily_gems: e.target.value })} placeholder="daily" className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <button onClick={addTier} className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black"><Plus size={14} /> Add tier</button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Gem size={18} className="text-gold" /> Gem packages</h2>
        <div className="flex flex-col gap-2">
          {pkgs.data?.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm">
              <input defaultValue={p.label} onBlur={(e) => e.target.value !== p.label && savePkg(p, { label: e.target.value })} className="min-w-[140px] flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-white" />
              <input defaultValue={p.gems} onBlur={(e) => Number(e.target.value) !== p.gems && savePkg(p, { gems: Number(e.target.value) })} className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-white" placeholder="gems" />
              <input defaultValue={p.price_usd} onBlur={(e) => Number(e.target.value) !== p.price_usd && savePkg(p, { price_usd: Number(e.target.value) })} className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-white" placeholder="$" />
              <label className="flex items-center gap-1 text-xs text-white/50"><input type="checkbox" defaultChecked={p.active} onChange={(e) => savePkg(p, { active: e.target.checked })} /> active</label>
              <button onClick={() => delPkg(p.id)} className="rounded-full p-1.5 text-rose hover:bg-white/10"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-white/10 p-3">
          <input value={np.label} onChange={(e) => setNp({ ...np, label: e.target.value })} placeholder="label (optional)" className="w-40 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <input value={np.gems} onChange={(e) => setNp({ ...np, gems: e.target.value })} placeholder="gems" className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <input value={np.price_usd} onChange={(e) => setNp({ ...np, price_usd: e.target.value })} placeholder="$ price" className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" />
          <button onClick={addPkg} className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black"><Plus size={14} /> Add package</button>
        </div>
      </section>
    </>
  );
}
