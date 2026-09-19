"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { VideoPlayer } from "@/components/content/video-player";

interface Detail { title: string; media_url: string | null; thumbnail_url: string | null; content_type: string; }

function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes("drive.google.com")) { const dr = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/); if (dr) return `https://drive.google.com/file/d/${dr[1]}/preview`; }
  if (url.includes("vimeo.com")) { const vm = url.match(/vimeo\.com\/(\d+)/); if (vm) return `https://player.vimeo.com/video/${vm[1]}`; }
  return null;
}

export default function EmbedPage({ params }: { params: { id: string } }) {
  const { data: d, isError } = useQuery({
    queryKey: ["embed", params.id],
    queryFn: () => apiGet<Detail>(`/api/content/${params.id}`),
    retry: false,
  });

  const media = d?.media_url ?? "";
  const embed = media ? embedSrc(media) : null;

  return (
    <div className="fixed inset-0 bg-black">
      {isError || (d && !media) ? (
        <div className="flex h-full items-center justify-center text-sm text-white/50">Video unavailable</div>
      ) : !d ? (
        <div className="flex h-full items-center justify-center text-sm text-white/50">Loading…</div>
      ) : embed ? (
        <iframe src={embed} className="h-full w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen title={d.title} />
      ) : (
        <VideoPlayer src={media} poster={d.thumbnail_url ?? undefined} />
      )}
    </div>
  );
}
