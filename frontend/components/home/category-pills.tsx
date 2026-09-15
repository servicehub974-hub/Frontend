"use client";

export const DISCOVERY_TABS = [
  "All Universe",
  "✨ Premier Drops",
  "🎬 Cinematic 8K",
  "📸 Macro Photo",
  "🎨 Neural Art",
  "🧩 Cyber Kits",
  "3D Scapes",
  "Lo-Fi Beats",
];

export function CategoryPills({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="sticky top-16 z-30 flex items-center gap-3 overflow-x-auto bg-gradient-to-b from-black via-black/90 to-transparent px-4 pb-6 pt-3 hide-scrollbar sm:top-20 sm:px-6">
      {DISCOVERY_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ${
            active === tab
              ? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "border-white/5 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
