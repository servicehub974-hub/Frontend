"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiGet } from "@/lib/api";

export function SearchBar() {
  const router = useRouter();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const { data: suggestions } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: () => apiGet<string[]>(`/api/search/suggestions?q=${encodeURIComponent(debounced)}`),
    enabled: open && debounced.length > 0,
  });
  const { data: trending } = useQuery({
    queryKey: ["search-trending"],
    queryFn: () => apiGet<string[]>("/api/search/trending"),
    enabled: open && debounced.length === 0,
  });
  const { data: recent } = useQuery({
    queryKey: ["search-recent"],
    queryFn: () => apiGet<{ id: string; query: string }[]>("/api/search/recent"),
    enabled: open && debounced.length === 0,
  });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (term: string) => { if (!term.trim()) return; setOpen(false); setQ(term); router.push(`/search?q=${encodeURIComponent(term.trim())}`); };
  const delRecent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await api(`/api/search/recent/${id}`, { method: "DELETE" }); } catch { /* */ }
    qc.invalidateQueries({ queryKey: ["search-recent"] });
  };

  const showSuggest = debounced.length > 0 && suggestions && suggestions.length > 0;
  const showEmpty = debounced.length === 0 && ((recent && recent.length > 0) || (trending && trending.length > 0));

  return (
    <div ref={ref} className="relative w-full max-w-lg">
      <form onSubmit={(e) => { e.preventDefault(); go(q); }}
        className="group flex w-full items-center rounded-full glass-pill px-4 py-2 transition-all duration-300 focus-within:border-white/20 focus-within:bg-white/10">
        <Search size={16} className="text-white/40 transition-colors group-focus-within:text-cyan" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search the universe..."
          className="w-full border-none bg-transparent px-3 text-sm font-light text-white outline-none placeholder:text-white/30"
        />
        {q && <button type="button" onClick={() => { setQ(""); setDebounced(""); }} className="text-white/40 hover:text-white"><X size={15} /></button>}
      </form>

      {open && (showSuggest || showEmpty) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f]/95 py-2 shadow-2xl backdrop-blur-xl">
          {showSuggest ? (
            suggestions!.map((s) => (
              <button key={s} onClick={() => go(s)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                <Search size={15} className="text-white/30" /> <span className="truncate">{s}</span>
              </button>
            ))
          ) : (
            <>
              {recent && recent.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-white/30">Recent</p>
                  {recent.map((r) => (
                    <button key={r.id} onClick={() => go(r.query)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                      <Clock size={15} className="text-white/30" />
                      <span className="flex-1 truncate">{r.query}</span>
                      <span onClick={(e) => delRecent(r.id, e)} className="text-white/30 hover:text-white"><X size={14} /></span>
                    </button>
                  ))}
                </>
              )}
              {trending && trending.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">Trending</p>
                  {trending.map((t) => (
                    <button key={t} onClick={() => go(t)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                      <TrendingUp size={15} className="text-cyan/60" /> <span className="truncate capitalize">{t}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
