"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, Bell, Gem, Crown, Zap } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function Header({
  onToggleSidebar,
  onOpenProfile,
}: {
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const { data: nc } = useQuery({
    queryKey: ["notif-unread"],
    queryFn: () => apiGet<{ count: number }>("/api/notifications/unread-count"),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unread = nc?.count ?? 0;
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiGet<{ gems: number }>("/api/wallet"),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const { data: vip } = useQuery({
    queryKey: ["vip-me"],
    queryFn: () => apiGet<{ active: boolean; tier: string | null }>("/api/vip/me"),
    enabled: !!user,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-2 px-3 transition-all duration-500 sm:h-20 sm:px-6 ${
        scrolled
          ? "border-b border-white/5 bg-black/80 backdrop-blur-2xl"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="group rounded-full p-2 text-white transition-colors hover:bg-white/10"
          aria-label="Menu"
        >
          <Menu size={22} className="transition-transform group-hover:scale-95" />
        </button>

        <Link href="/" className="group flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 opacity-20 transition-opacity duration-500 group-hover:opacity-100" />
            <Zap size={16} className="relative z-10 fill-white text-white" />
          </div>
          <span className="hidden text-xl font-bold tracking-tighter text-white sm:block">
            NEXUS<span className="font-light text-white/30">PRO</span>
          </span>
        </Link>
      </div>

      <div className="hidden max-w-2xl flex-1 items-center justify-center px-4 sm:flex">
        <SearchBar />
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-4">
        <Link href="/search" className="rounded-full p-2 text-white hover:bg-white/10 sm:hidden" aria-label="Search">
          <Search size={20} />
        </Link>

        {loading ? (
          <div className="h-9 w-16 animate-pulse rounded-full bg-white/5" />
        ) : user ? (
          <>
            <div className="hidden items-center gap-4 lg:flex">
              <Link href="/gems" className="flex items-center gap-1.5">
                <Gem size={14} className="text-gold" />
                <span className="text-sm font-semibold text-white">{(wallet?.gems ?? 0).toLocaleString()}</span>
              </Link>
              <div className="h-4 w-px bg-white/10" />
              <Link href="/vip" className="flex items-center gap-1.5">
                <Crown size={14} className="text-fuchsia" />
                <span className={vip?.active ? "text-gradient-violet text-sm font-bold" : "text-sm font-semibold text-white/40"}>{vip?.active ? (vip.tier ? vip.tier.toUpperCase() : "VIP") : "VIP"}</span>
              </Link>
            </div>

            <Link href="/notifications" className="group relative rounded-full p-2 transition-colors hover:bg-white/10" aria-label="Notifications">
              <Bell size={20} className="text-white/80 transition-colors group-hover:text-white" />
              {unread > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <button
              onClick={onOpenProfile}
              className="group rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 p-0.5 transition-all hover:shadow-glow-cyan"
              aria-label="Profile menu"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar_url ?? `https://i.pravatar.cc/150?u=${user.username ?? user.id}`}
                alt={user.username ?? "Profile"}
                className="h-8 w-8 rounded-full border-2 border-black object-cover sm:h-9 sm:w-9"
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
