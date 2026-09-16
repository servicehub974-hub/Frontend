"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Clapperboard, Plus, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export function MobileBottomNav({ onProfile }: { onProfile: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-white/5 glass-panel px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:hidden">
      <Link href="/" className="flex h-full w-full flex-col items-center justify-center">
        <Compass size={20} className={isActive("/") ? "text-white" : "text-white/40"} />
        <span className={`text-[9px] ${isActive("/") ? "text-white" : "text-white/40"}`}>Discover</span>
      </Link>

      <Link href="/reels" className="flex h-full w-full flex-col items-center justify-center">
        <Clapperboard size={20} className={isActive("/reels") ? "text-white" : "text-white/40"} />
        <span className={`text-[9px] ${isActive("/reels") ? "text-white" : "text-white/40"}`}>Reels</span>
      </Link>

      <Link href="/upload" className="flex h-full w-full flex-col items-center justify-center">
        <div className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 text-white shadow-glow-cyan active:scale-95">
          <Plus size={24} strokeWidth={2.5} />
        </div>
      </Link>

      <Link href="/messages" className="flex h-full w-full flex-col items-center justify-center">
        <MessageSquare size={20} className={isActive("/messages") ? "text-white" : "text-white/40"} />
        <span className={`text-[9px] ${isActive("/messages") ? "text-white" : "text-white/40"}`}>Messages</span>
      </Link>

      <button onClick={onProfile} className="flex h-full w-full flex-col items-center justify-center">
        {user ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.avatar_url ?? `https://i.pravatar.cc/150?u=${user.username ?? user.id}`}
            alt="Profile"
            className="h-6 w-6 rounded-full border border-white/20 object-cover"
          />
        ) : (
          <User size={20} className="text-white/40" />
        )}
        <span className="text-[9px] text-white/40">Profile</span>
      </button>
    </nav>
  );
}
