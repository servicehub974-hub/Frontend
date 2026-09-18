"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Flame, Radio, Grid3x3, Heart, Bookmark, Clock, ListVideo,
  Crown, Gem, ShoppingBag, Upload, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type Item =
  | { divider: true }
  | {
      icon: LucideIcon;
      label: string;
      href: string;
      premium?: boolean;
      creatorOnly?: boolean;
      color?: string;
    };

const ITEMS: Item[] = [
  { icon: Compass, label: "Discover", href: "/" },
  { icon: Flame, label: "Trending", href: "/trending" },
  { icon: Radio, label: "Live Streams", href: "/live" },
  { icon: Grid3x3, label: "Categories", href: "/categories" },
  { divider: true },
  { icon: Bookmark, label: "Favorites", href: "/favorites" },
  { icon: Heart, label: "Loved", href: "/liked" },
  { icon: Clock, label: "Timeline", href: "/history" },
  { icon: ListVideo, label: "Playlists", href: "/playlists" },
  { divider: true },
  { icon: Upload, label: "Upload", href: "/upload", creatorOnly: true, color: "text-cyan" },
  { icon: ShoppingBag, label: "Shop", href: "/shop" },
  { icon: Crown, label: "VIP Lounge", href: "/vip", premium: true, color: "text-fuchsia" },
  { icon: Gem, label: "Gem Exchange", href: "/gems", premium: true, color: "text-gold" },
];

export function Sidebar({
  isCompact,
  isMobile,
  drawerOpen,
  onClose,
}: {
  isCompact: boolean;
  isMobile: boolean;
  drawerOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isCreator = user?.role === "creator" || user?.role === "admin";

  // Mobile always shows labels; only desktop uses the compact rail.
  const compact = isMobile ? false : isCompact;
  const width = isMobile ? "w-72" : compact ? "w-[72px]" : "w-64";
  const translate = isMobile
    ? drawerOpen
      ? "translate-x-0"
      : "-translate-x-full"
    : "translate-x-0";

  return (
    <>
      {isMobile && drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-40 overflow-y-auto border-r border-white/5 bg-black/70 backdrop-blur-xl transition-all duration-300 hide-scrollbar sm:top-20",
          width,
          translate
        )}
      >
        <nav className="flex flex-col gap-1 px-3 py-6">
          {ITEMS.map((item, i) => {
            if ("divider" in item)
              return <div key={i} className="mx-2 my-3 h-px bg-white/5" />;
            if (item.creatorOnly && !isCreator) return null;

            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                title={compact ? item.label : undefined}
                className={cn(
                  "group relative flex items-center rounded-xl transition-all duration-300",
                  compact ? "justify-center p-3" : "px-4 py-3",
                  active
                    ? "bg-white/10 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.5)]"
                    : "hover:bg-white/5"
                )}
              >
                <Icon
                  size={compact ? 22 : 20}
                  className={cn(
                    "shrink-0 transition-all duration-300",
                    active
                      ? "scale-110 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      : item.color ?? "text-white/50 group-hover:text-white/80"
                  )}
                />
                {!compact && (
                  <span
                    className={cn(
                      "ml-4 text-sm font-medium tracking-wide transition-colors",
                      item.premium
                        ? "text-gradient-violet"
                        : active
                          ? "text-white"
                          : item.color ?? "text-white/60 group-hover:text-white"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
