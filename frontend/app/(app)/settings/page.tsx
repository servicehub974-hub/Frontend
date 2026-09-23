"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Settings as SettingsIcon, Lock, LogOut, History, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";

interface LoginRow { ip: string | null; user_agent: string | null; at: string | null; }

function deviceOf(ua: string | null) {
  if (!ua) return "Unknown device";
  const b = /Chrome|Firefox|Safari|Edg|Opera/.exec(ua)?.[0] ?? "Browser";
  const o = /Windows|Mac|Android|iPhone|iPad|Linux/.exec(ua)?.[0] ?? "";
  return `${b}${o ? " · " + o : ""}`;
}

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const logins = useQuery({ queryKey: ["logins"], queryFn: () => apiGet<LoginRow[]>("/api/users/me/logins"), enabled: !!user });

  const changePw = async () => {
    setMsg(null);
    if (pw.length < 6) return setMsg({ ok: false, text: "Password must be at least 6 characters." });
    if (pw !== pw2) return setMsg({ ok: false, text: "Passwords don't match." });
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg({ ok: true, text: "Password updated." }); setPw(""); setPw2("");
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to update password." }); }
    finally { setBusy(false); }
  };

  const signOutEverywhere = async () => {
    if (!confirm("Sign out of all devices?")) return;
    try { await supabase.auth.signOut({ scope: "global" }); } catch { /* */ }
    logout();
  };

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Please log in to view settings.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader icon={SettingsIcon} title="Settings" />

      {/* Account */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><User size={16} className="text-cyan" /> Account</h2>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-white/70">Name: <span className="text-white">{user.display_name || user.username || "—"}</span></p>
          <p className="text-white/70">Email: <span className="text-white">{user.email || "—"}</span></p>
          <p className="text-white/70">Role: <span className="capitalize text-white">{user.role}</span></p>
        </div>
        <Link href="/channel/edit" className="mt-3 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/15">Edit profile</Link>
      </section>

      {/* Password */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Lock size={16} className="text-gold" /> Change password</h2>
        <div className="flex flex-col gap-2">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          <div className="flex items-center gap-3">
            <button onClick={changePw} disabled={busy} className="self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">{busy ? "Saving…" : "Update password"}</button>
            {msg && <span className={`text-sm font-medium ${msg.ok ? "text-green-400" : "text-rose"}`}>{msg.text}</span>}
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck size={16} className="text-cyan" /> Sessions</h2>
        <p className="mb-3 text-sm text-white/50">Signed in on this device. You can sign out everywhere if you suspect someone else has access.</p>
        <button onClick={signOutEverywhere} className="flex items-center gap-2 rounded-full bg-rose/20 px-4 py-2 text-sm font-semibold text-rose hover:bg-rose/30"><LogOut size={15} /> Sign out of all devices</button>
      </section>

      {/* Login history */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><History size={16} className="text-white/50" /> Login history</h2>
        {!logins.data || logins.data.length === 0 ? (
          <p className="text-sm text-white/40">No recent logins recorded yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-white/5 text-sm">
            {logins.data.map((l, i) => (
              <div key={i} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-white/80">{deviceOf(l.user_agent)}</span>
                <span className="text-xs text-white/40">{l.ip || "—"} · {l.at ? new Date(l.at).toLocaleString() : ""}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
