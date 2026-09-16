export type Tier = "free" | "gems" | "vip";

export interface ContentItem {
  id: string;
  title: string;
  thumbnail: string;
  is_video: boolean;
  duration: string | null;
  creator: { name: string; avatar: string; verified: boolean };
  tier: Tier;
  price_gems: number | null;
  views: string;
  time_ago: string;
}

export interface FeedPage {
  items: ContentItem[];
  next_cursor: string | null;
}
