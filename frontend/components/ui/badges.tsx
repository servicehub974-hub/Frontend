import { Gem, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "./glass-panel";

type Tier = "free" | "gems" | "vip";

/**
 * Access-tier marker shown on content cards.
 * `free` renders nothing (no badge for free content).
 */
export function TierBadge({
  tier,
  priceGems,
}: {
  tier: Tier;
  priceGems?: number | null;
}) {
  if (tier === "free") return null;

  if (tier === "gems") {
    return (
      <Pill className="border-gold/30 bg-gold/10">
        <Gem size={12} className="text-gold drop-shadow-[0_0_5px_rgba(245,166,35,0.5)]" />
        <span className="font-bold tracking-wide text-white">{priceGems}</span>
      </Pill>
    );
  }

  return (
    <Pill className="border-fuchsia/30 bg-fuchsia/10">
      <Crown size={12} className="text-fuchsia" />
      <span className="text-gradient-violet font-bold tracking-widest">VIP</span>
    </Pill>
  );
}

/** Shimmering placeholder for loading states. Match the card aspect ratio. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl border border-subtle", className)} />;
}
