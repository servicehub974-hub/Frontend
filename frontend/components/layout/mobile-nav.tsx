"use client";

import { Compass, Radio, Plus, Layers, User, type LucideIcon } from "lucide-react";

type NavItem = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  special?: boolean;
};

const ITEMS: NavItem[] = [
  { icon: Compass, label: "Discover", active: true },
  { icon: Radio, label: "Live" },
  { icon: Plus, label: "Create", special: true },
  { icon: Layers, label: "Vault" },
  { icon: User, label: "Profile" },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t-0 glass-panel px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:hidden">
      {ITEMS.map((item, i) => {
        const Icon = item.icon;
        return (
          <a
            key={i}
            href="#"
            className="group relative flex h-full w-full flex-col items-center justify-center"
          >
            {item.special ? (
              <div className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 text-white shadow-glow-cyan transition-transform active:scale-95">
                <Plus size={24} strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <Icon
                  size={20}
                  className={`mb-1 transition-all duration-300 ${
                    item.active
                      ? "scale-110 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                      : "text-white/40"
                  }`}
                />
                <span
                  className={`text-[9px] font-medium tracking-wide ${
                    item.active ? "text-white" : "text-white/40"
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </a>
        );
      })}
    </nav>
  );
}
