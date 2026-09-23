"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";

interface Review { rating: number; body: string | null; name: string; avatar: string; at: string | null; }
interface ReviewsData { average: number; count: number; items: Review[]; }

function Stars({ n, size = 14, onPick }: { n: number; size?: number; onPick?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onPick} onClick={() => onPick?.(i)} className={onPick ? "cursor-pointer" : "cursor-default"}>
          <Star size={size} className={i <= n ? "fill-gold text-gold" : "text-white/25"} />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["reviews"], queryFn: () => apiGet<ReviewsData>("/api/reviews") });
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    try { await api("/api/reviews", { method: "POST", json: { rating, body: body.trim() || null } }); setDone(true); qc.invalidateQueries({ queryKey: ["reviews"] }); } catch { /* */ }
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">What members say</h2>
        {data && data.count > 0 && (
          <div className="flex items-center gap-2">
            <Stars n={Math.round(data.average)} />
            <span className="text-sm text-white/60">{data.average} · {data.count} review{data.count === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>

      {user && !done && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-sm font-medium text-white">Leave a review</p>
          <Stars n={rating} size={22} onPick={setRating} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Share your experience…" className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          <button onClick={submit} className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90">Submit</button>
        </div>
      )}
      {done && <p className="mb-5 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">Thanks for your review!</p>}

      {data && data.items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.items.map((r, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm font-medium text-white">{r.name}</span>
                <div className="ml-auto"><Stars n={r.rating} /></div>
              </div>
              {r.body && <p className="text-sm text-white/70">{r.body}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/40">No reviews yet — be the first!</p>
      )}
    </section>
  );
}
