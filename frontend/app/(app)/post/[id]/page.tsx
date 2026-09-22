"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { PostCard, type Post } from "@/components/posts/post-card";

export default function PostPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["post", params.id],
    queryFn: () => apiGet<Post>(`/api/posts/${params.id}`),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {isLoading ? (
        <p className="py-16 text-center text-white/40">Loading…</p>
      ) : isError || !data ? (
        <p className="py-16 text-center text-white/60">Post not found.</p>
      ) : (
        <PostCard post={data} />
      )}
    </div>
  );
}
