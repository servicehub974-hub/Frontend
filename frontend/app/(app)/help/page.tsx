"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, ChevronDown, MessageSquareHeart } from "lucide-react";
import { PageHeader } from "@/components/ui/empty-state";

const SECTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is NEXUS?",
    a: <>NEXUS is a premium content platform where you can watch and share videos, post short vertical Reels, publish Facebook-style posts, message people, and support creators. Some content is free and some is premium (unlocked with Gems).</>,
  },
  {
    q: "How do I upload a video or Reel?",
    a: <>Tap <b>Upload</b> (in the sidebar or your profile menu). Choose a video file or paste a link (YouTube, Google Drive, Vimeo, or a direct .mp4). If your video is vertical and short, it automatically becomes a <b>Reel</b>. No thumbnail? We grab a frame from your video automatically. Use <b>.mp4</b> for the widest playback support (some formats like .mkv don't play in browsers).</>,
  },
  {
    q: "What are Reels and how do they work?",
    a: <>Reels are vertical short videos. Open <Link href="/reels" className="text-cyan hover:underline">Reels</Link>, swipe up/down to move between them, <b>double-tap to like</b>, and tap the icons to comment, follow or share. Your Reels feed is personalized, so it looks different for everyone.</>,
  },
  {
    q: "What's the Feed and how do posts work?",
    a: <>The <Link href="/feed" className="text-cyan hover:underline">Feed</Link> is for Facebook-style posts — text, links (auto-highlighted), photos, and even a video card. Anyone can post. Each post supports Like, Comment (with replies), Share, Repost and Save. Long posts collapse with a "See more".</>,
  },
  {
    q: "What are Gems?",
    a: <>Gems are the in-app currency. You can buy Gems on the <Link href="/gems" className="text-cyan hover:underline">Gems</Link> page, then spend them to unlock premium content or subscribe to VIP. Your balance is always shown in the top bar, and every change is recorded in your history.</>,
  },
  {
    q: "How do I buy Gems or VIP? (Manual payment)",
    a: <>Pick a Gem pack or a money-priced VIP tier and you'll see the admin's payment details. Pay outside the app, then submit your <b>Transaction / Order ID</b>. An admin verifies it and your Gems/VIP are activated. Gem-priced VIP tiers are charged instantly from your Gem balance.</>,
  },
  {
    q: "What is VIP?",
    a: <>VIP (Silver / Gold / Platinum / Lifetime) gives perks like no ads, exclusive content, a <b>crown badge</b> shown everywhere, and a daily Gem bonus. Manage it on the <Link href="/vip" className="text-cyan hover:underline">VIP</Link> page. Time-limited tiers expire automatically and you'll get a notification.</>,
  },
  {
    q: "How does premium content work?",
    a: <>Some videos/Reels are premium. Tap <b>Unlock</b> and confirm to spend the Gem price — once unlocked it's yours <b>for life</b>. The Gems you spend go to the creator as their earnings.</>,
  },
  {
    q: "Messaging",
    a: <>Open <Link href="/messages" className="text-cyan hover:underline">Messages</Link> to chat. You'll see who's active, unread counts, and can send emojis. Hover your own message to <b>edit</b> or <b>delete</b> it. An empty message sends a 👍.</>,
  },
  {
    q: "Playlists, Following, Saved & Liked",
    a: <>Build <Link href="/playlists" className="text-cyan hover:underline">Playlists</Link> (public/unlisted/private), see who you follow under <Link href="/following" className="text-cyan hover:underline">Following</Link>, and find everything you bookmarked or liked under Favorites and Loved.</>,
  },
  {
    q: "Creator Studio",
    a: <>Creators manage everything in the <Link href="/creator/dashboard" className="text-cyan hover:underline">Creator Studio</Link>: filter your videos/Reels/posts, see views·likes·comments, change visibility, set premium price, toggle comments and download permission, edit or delete.</>,
  },
  {
    q: "Trending & Search",
    a: <>The <Link href="/trending" className="text-cyan hover:underline">Trending</Link> page ranks content by views, likes and comments (with a freshness boost). Use the search bar for live suggestions, recent and trending searches, plus filters and sorting.</>,
  },
  {
    q: "Notifications",
    a: <>You'll be notified for new followers, comments, replies, likes, reposts, purchases of your content, approved orders, and VIP expiry — each showing who did it and a thumbnail.</>,
  },
  {
    q: "Something isn't working",
    a: <>Try a hard refresh (Ctrl/Cmd+Shift+R). If a video won't play, it may be an unsupported format — re-upload as <b>.mp4</b>. Still stuck? Send us a note from the <Link href="/feedback" className="text-cyan hover:underline">Feedback</Link> page.</>,
  },
];

function Item({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="font-medium text-white">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-white/70">{a}</div>}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader icon={LifeBuoy} title="Help Center" />
      <div className="flex flex-col">
        {SECTIONS.map((s) => <Item key={s.q} q={s.q} a={s.a} />)}
      </div>
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <p className="font-semibold text-white">Still need help?</p>
          <p className="text-sm text-white/50">Send us a message and we'll take a look.</p>
        </div>
        <Link href="/feedback" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"><MessageSquareHeart size={16} /> Feedback</Link>
      </div>
    </div>
  );
}
