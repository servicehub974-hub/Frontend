"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Grid3x3 } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/badges";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
}

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Grid3x3 size={24} className="text-cyan" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Categories</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3]" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center text-white/50">
          No categories yet. An admin can create them.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border border-white/5 bg-elevated p-4 transition-all hover:border-white/20"
            >
              {c.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnail_url} alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="relative z-10 font-semibold text-white">{c.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
