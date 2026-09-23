"use client";

import { useState } from "react";
import { MessageSquareHeart, CheckCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";

const CATEGORIES = ["General", "Bug report", "Feature request", "Payment / VIP", "Content issue", "Other"];

export default function FeedbackPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (message.trim().length < 2) return;
    setBusy(true);
    try {
      await api("/api/feedback", { method: "POST", json: { category, message: message.trim(), email: email.trim() || null } });
      setDone(true);
    } catch { /* */ } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader icon={MessageSquareHeart} title="Feedback" tint="text-rose" />
      {done ? (
        <div className="glass-panel flex flex-col items-center rounded-2xl p-10 text-center">
          <CheckCircle size={44} className="mb-3 text-green-400" />
          <p className="text-lg font-semibold text-white">Thanks for your feedback!</p>
          <p className="mt-1 text-sm text-white/50">We read every message and use it to make NEXUS better.</p>
        </div>
      ) : (
        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-5">
          <label className="text-xs font-medium text-white/50">Topic
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-white/50">Your message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Tell us what's on your mind — a bug, an idea, or anything else…" className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50" />
          </label>
          {!user && (
            <label className="text-xs font-medium text-white/50">Email (optional, if you'd like a reply)
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50" />
            </label>
          )}
          <button onClick={submit} disabled={busy || message.trim().length < 2} className="mt-1 self-start rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
            {busy ? "Sending…" : "Send feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
