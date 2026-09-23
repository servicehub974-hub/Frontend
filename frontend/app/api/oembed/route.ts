import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// oEmbed provider endpoint: GET /api/oembed?url=<site>/content/<id>&format=json
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  const m = url.match(/\/content\/([0-9a-fA-F-]{36})/);
  if (!m) return NextResponse.json({ error: "Not an embeddable URL" }, { status: 404 });
  const id = m[1];
  const maxwidth = Number(req.nextUrl.searchParams.get("maxwidth")) || 640;
  const maxheight = Number(req.nextUrl.searchParams.get("maxheight")) || 360;

  try {
    const res = await fetch(`${API}/api/content/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("not found");
    const d = await res.json();
    const embed = `${SITE}/embed/${id}`;
    return NextResponse.json({
      version: "1.0",
      type: "video",
      provider_name: "NEXUS",
      provider_url: SITE,
      title: d.title,
      thumbnail_url: d.thumbnail_url ?? undefined,
      thumbnail_width: 1280,
      thumbnail_height: 720,
      width: maxwidth,
      height: maxheight,
      html: `<iframe src="${embed}" width="${maxwidth}" height="${maxheight}" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen title="${(d.title || "").replace(/"/g, "&quot;")}"></iframe>`,
    });
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
}
