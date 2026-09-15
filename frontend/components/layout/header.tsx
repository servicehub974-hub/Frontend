"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, Bell, Gem, Crown, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 transition-all duration-500 sm:h-20 sm:px-6 ${
        scrolled
          ? "border-b border-white/5 bg-black/80 backdrop-blur-2xl"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={onToggleSidebar}
          className="group hidden rounded-full p-2 text-white transition-colors hover:bg-white/10 sm:block"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} className="transition-transform group-hover:scale-95" />
        </button>

        <Link href="/" className="group flex cursor-pointer items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 opacity-20 transition-opacity duration-500 group-hover:opacity-100" />
            <Zap size={16} className="relative z-10 fill-white text-white" />
          </div>
          <span className="hidden text-xl font-bold tracking-tighter text-white md:block">
            NEXUS<span className="font-light text-white/30">PRO</span>
          </span>
        </Link>
      </div>

      <div className="hidden max-w-2xl flex-1 items-center justify-center px-6 sm:flex">
        <div className="group flex w-full max-w-lg items-center rounded-full glass-pill px-4 py-2 transition-all duration-300 hover:bg-white/5 focus-within:border-white/20 focus-within:bg-white/10">
          <Search size={16} className="text-white/40 transition-colors group-focus-within:text-cyan" />
          <input
            type="text"
            placeholder="Search the universe..."
            className="w-full border-none bg-transparent px-3 text-sm font-light text-white outline-none placeholder:text-white/30"
          />
          <div className="hidden items-center gap-1 lg:flex">
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">⌘</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 sm:gap-5">
        <button className="rounded-full p-2 text-white hover:bg-white/10 sm:hidden" aria-label="Search">
          <Search size={20} />
        </button>

        {loading ? (
          <div className="h-9 w-20 animate-pulse rounded-full bg-white/5" />
        ) : user ? (
          <>
            <div className="hidden items-center gap-4 lg:flex">
              <div className="group flex cursor-pointer items-center gap-1.5">
                <Gem size={14} className="text-gold" />
                <span className="text-sm font-semibold text-white">1,250</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <Link href="/vip" className="group flex cursor-pointer items-center gap-1.5">
                <Crown size={14} className="text-fuchsia" />
                <span className="text-gradient-violet text-sm font-bold">VIP</span>
              </Link>
            </div>

            <button className="group relative rounded-full p-2 transition-colors hover:bg-white/10" aria-label="Notifications">
              <Bell size={20} className="text-white/80 transition-colors group-hover:text-white" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 animate-pulse rounded-full bg-rose shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="group flex items-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 p-0.5 transition-all hover:shadow-glow-cyan"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    user.avatar_url ??
                    `https://i.pravatar.cc/150?u=${user.username}`
                  }
                  alt={user.username}
                  className="h-8 w-8 rounded-full border-2 border-black object-cover sm:h-9 sm:w-9"
                />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-56 glass-panel rounded-xl p-2">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {user.display_name ?? user.username}
                      </p>
                      <p className="truncate text-xs text-white/40">@{user.username}</p>
                      <span className="mt-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                        {user.role}
                      </span>
                    </div>
                    <div className="my-1 h-px bg-white/5" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
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
