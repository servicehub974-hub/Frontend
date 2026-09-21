"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface Cat { id: string; name: string; slug: string; }

export function CategoryPills({
  active,
  onChange,
}: {
  active: string;
  onChange: (slug: string) => void;
}) {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Cat[]>("/api/categories"),
  });

  const tabs = [{ name: "All Universe", slug: "" }, ...(data ?? [])];

  return (
    <div className="sticky top-16 z-30 flex items-center gap-3 overflow-x-auto bg-gradient-to-b from-black via-black/90 to-transparent px-4 pb-6 pt-3 hide-scrollbar sm:top-20 sm:px-6">
      {tabs.map((t) => (
        <button
          key={t.slug || "all"}
          onClick={() => onChange(t.slug)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ${
            active === t.slug
              ? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "border-white/5 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
