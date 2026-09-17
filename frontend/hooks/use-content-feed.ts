import { useInfiniteQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { FeedPage } from "@/lib/types";

export function useContentFeed(category: string) {
  return useInfiniteQuery({
    queryKey: ["content-feed", category],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "12", category });
      if (pageParam) params.set("cursor", pageParam);
      return apiGet<FeedPage>(`/api/content?${params.toString()}`);
    },
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
}
