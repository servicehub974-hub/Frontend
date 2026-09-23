"use client";

import { Sparkles, Play, Bookmark, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroPoster() {
  return (
    <div className="group relative mb-12 mt-4 h-[60vh] min-h-[500px] w-full overflow-hidden rounded-xl border border-white/5 animate-reveal sm:mt-0 sm:h-[70vh]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400"
        alt="Featured"
        className="absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-[30s] ease-out group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent opacity-90" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <div className="absolute inset-0 flex w-full flex-col justify-end p-6 sm:p-10 md:w-3/4 lg:w-2/3 lg:p-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
            <Sparkles size={12} className="text-cyan" /> Premium Premiere
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-2xl sm:text-5xl lg:text-7xl">
          The Genesis of <br />
          <span className="bg-gradient-to-r from-white via-cyan-100 to-white/50 bg-clip-text text-transparent">
            Digital Realms
          </span>
        </h1>

        <p className="mb-6 max-w-xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
          Explore the highest fidelity 3D assets and cinematic environments
          curated for visionary creators.
        </p>

        <div className="mb-8 flex items-center gap-4 text-xs font-medium text-white/50 sm:text-sm">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-2 py-1 backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.pravatar.cc/150?u=nexus"
              className="h-5 w-5 rounded-full"
              alt="creator"
            />
            <span className="cursor-pointer text-white transition-colors hover:text-cyan">
              Nexus Labs
            </span>
            <CheckCircle size={12} className="fill-cyan-400/20 text-cyan" />
          </div>
          <span className="text-gold">★ 4.9</span>
          <span>24.8K views</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg">
            <Play size={18} className="fill-black" /> Stream now
          </Button>
          <Button variant="glass" size="lg">
            <Bookmark size={18} /> Add to vault
          </Button>
        </div>
      </div>
    </div>
  );
}
