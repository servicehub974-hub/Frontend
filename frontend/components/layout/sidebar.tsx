"use client";

import {
  Compass,
  Flame,
  Radio,
  Layers,
  Clock,
  Heart,
  Crown,
  Gem,
  type LucideIcon,
} from "lucide-react";

type Item =
  | { divider: true }
  | {
      icon: LucideIcon;
      label: string;
      path: string;
      premium?: boolean;
      color?: string;
    };

const ITEMS: Item[] = [
  { icon: Compass, label: "Discover", path: "home" },
  { icon: Flame, label: "Trending", path: "trending" },
  { icon: Radio, label: "Live Streams", path: "live" },
  { divider: true },
  { icon: Layers, label: "My Vault", path: "library" },
  { icon: Clock, label: "Timeline", path: "history" },
  { icon: Heart, label: "Loved", path: "liked" },
  { divider: true },
  { icon: Crown, label: "VIP Lounge", path: "vip", premium: true, color: "text-fuchsia" },
  { icon: Gem, label: "Gem Exchange", path: "gems", premium: true, color: "text-gold" },
];

export function Sidebar({
  isCompact,
  isMobile,
  activePath = "home",
}: {
  isCompact: boolean;
  isMobile: boolean;
  activePath?: string;
}) {
  return (
    <aside
      className={`fixed bottom-0 left-0 top-16 z-40 overflow-y-auto border-r border-white/5 bg-black/40 backdrop-blur-md transition-all duration-300 hide-scrollbar sm:top-20 ${
        isMobile ? "-translate-x-full" : "translate-x-0"
      } ${isCompact ? "w-[72px]" : "w-64"}`}
    >
      <div className="flex flex-col gap-1 px-3 py-6">
        {ITEMS.map((item, i) => {
          if ("divider" in item) return <div key={i} className="mx-2 my-4 h-px bg-white/5" />;

          const isActive = activePath === item.path;
          const Icon = item.icon;

          return (
            <a
              key={i}
              href="#"
              title={isCompact ? item.label : undefined}
              className={`group relative flex items-center rounded-xl transition-all duration-300 ${
                isCompact ? "justify-center p-3" : "px-4 py-3"
              } ${isActive ? "bg-white/10 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.5)]" : "hover:bg-white/5"}`}
            >
              <Icon
                size={isCompact ? 22 : 20}
                className={`transition-all duration-300 ${
                  isActive
                    ? "scale-110 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : item.color ?? "text-white/50 group-hover:text-white/80"
                }`}
              />
              {!isCompact && (
                <span
                  className={`ml-4 text-sm font-medium tracking-wide transition-colors ${
                    item.premium
                      ? "text-gradient-violet"
                      : isActive
                        ? "text-white"
                        : item.color ?? "text-white/50 group-hover:text-white/90"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </aside>
  );
}
