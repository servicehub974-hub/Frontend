"use client";

import Link from "next/link";
import {
  User as UserIcon,
  LayoutDashboard,
  Shield,
  Upload,
  Sparkles,
  Gem,
  Crown,
  ShoppingBag,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  Flag,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useFeature } from "@/lib/use-features";

function Row({
  href,
  icon: Icon,
  label,
  onClose,
  right,
  danger,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  onClose: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  const cls =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " +
    (danger
      ? "text-white/70 hover:bg-white/5 hover:text-white"
      : "text-white/70 hover:bg-white/5 hover:text-white");
  const inner = (
    <>
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {right}
    </>
  );
  if (href)
    return (
      <Link href={href} onClick={onClose} className={cls}>
        {inner}
      </Link>
    );
  return null;
}

export function ProfileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout, becomeCreator } = useAuth();
  const messagesEnabled = useFeature("messages");
  if (!open || !user) return null;

  const isCreator = user.role === "creator" || user.role === "admin";
  const isAdmin = user.role === "admin";

  const divider = <div className="my-1.5 h-px bg-white/5" />;

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="fixed z-[70] overflow-y-auto glass-panel hide-scrollbar
          bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]
          sm:bottom-auto sm:left-auto sm:right-4 sm:top-[4.75rem] sm:w-80 sm:rounded-xl"
      >
        {/* mobile grabber */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        {/* user header */}
        <div className="flex items-center gap-3 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar_url ?? `https://i.pravatar.cc/150?u=${user.username ?? user.id}`}
            alt={user.username ?? "Profile"}
            className="h-11 w-11 rounded-full border border-white/15 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">
              {user.display_name ?? user.username ?? "User"}
            </p>
            <p className="truncate text-xs text-white/40">@{user.username ?? "user"}</p>
          </div>
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">
            {user.role}
          </span>
        </div>

        {divider}

        <div className="px-2 py-1">
          <Row href={`/channel/${user.id}`} icon={UserIcon} label="Your channel" onClose={onClose} />
          {isCreator && (
            <Row href="/creator/dashboard" icon={LayoutDashboard} label="Creator Dashboard" onClose={onClose} />
          )}
          {isCreator && <Row href="/upload" icon={Upload} label="Upload" onClose={onClose} />}
          {isAdmin && <Row href="/admin" icon={Shield} label="Admin Panel" onClose={onClose} />}
          {user.role === "user" && (
            <button
              onClick={async () => {
                onClose();
                try {
                  await becomeCreator();
                } catch {
                  /* ignore */
                }
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fuchsia transition-colors hover:bg-white/5"
            >
              <Sparkles size={18} className="shrink-0" />
              <span className="flex-1 text-left">Become a creator</span>
            </button>
          )}
        </div>

        {divider}

        <div className="px-2 py-1">
          <Row href="/gems" icon={Gem} label="Gems" onClose={onClose} right={<span className="text-xs font-semibold text-gold">1,250</span>} />
          <Row href="/vip" icon={Crown} label="VIP" onClose={onClose} />
          <Row href="/shop" icon={ShoppingBag} label="Shop" onClose={onClose} />
          {messagesEnabled && <Row href="/messages" icon={MessageSquare} label="Messages" onClose={onClose} />}
          <Row href="/notifications" icon={Bell} label="Notifications" onClose={onClose} />
        </div>

        {divider}

        <div className="px-2 py-1">
          <Row href="/settings" icon={Settings} label="Settings" onClose={onClose} />
          <Row href="/help" icon={HelpCircle} label="Help" onClose={onClose} />
          <Row href="/feedback" icon={Flag} label="Feedback" onClose={onClose} />
        </div>

        {divider}

        <div className="px-2 py-1 pb-3">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </div>
      </div>
    </>
  );
}
