import type { Metadata } from "next";
import { WatchClient } from "@/components/content/watch-client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/api/content/${params.id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    const d = await res.json();
    const img: string[] = d.thumbnail_url ? [d.thumbnail_url] : [];
    const embed = SITE ? `${SITE}/embed/${params.id}` : undefined;
    return {
      title: d.title,
      description: d.description ?? "Watch on NEXUS",
      openGraph: {
        title: d.title,
        description: d.description ?? "",
        images: img,
        type: "video.other",
        ...(embed ? { videos: [{ url: embed, width: 1280, height: 720 }] } : {}),
      },
      twitter: {
        card: embed ? "player" : "summary_large_image",
        title: d.title,
        description: d.description ?? "",
        images: img,
      },
    };
  } catch {
    return { title: "NEXUS" };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <WatchClient id={params.id} />;
}
