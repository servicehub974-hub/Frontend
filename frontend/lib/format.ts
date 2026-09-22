// Compact number formatting like YouTube: 1K, 1.2M, 3B
export function fmtCount(n: number): string {
  try {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}
