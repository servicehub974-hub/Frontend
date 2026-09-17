"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Pin, Trash2, CheckCircle } from "lucide-react";
import { api, apiGet, type ApiError } from "@/lib/api";
import { useAuth, type User } from "@/providers/auth-provider";
import { fmtCount } from "@/lib/format";
import { supabase } from "@/lib/supabase";

interface CommentT {
  id: string;
  parent_id: string | null;
  body: string;
  time_ago: string;
  author: { id: string; name: string; avatar: string; verified: boolean };
  like_count: number;
  is_liked: boolean;
  reply_count: number;
  is_pinned: boolean;
}

function canModerate(user: User | null, c: CommentT, ownerId: string) {
  if (!user) return { del: false, pin: false };
  const admin = user.role === "admin";
  return {
    del: (c.author.id && c.author.id === user.id) || user.id === ownerId || admin,
    pin: user.id === ownerId || admin,
  };
}

function CommentBox({
  onSubmit,
  placeholder,
  compact,
}: {
  onSubmit: (body: string, anonName?: string) => Promise<void>;
  placeholder: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await onSubmit(body.trim(), name.trim() || undefined);
      setBody("");
    } catch (e) {
      if ((e as ApiError).status === 401) router.push("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={user ? (user.avatar_url ?? `https://i.pravatar.cc/150?u=${user.username ?? user.id}`) : "https://i.pravatar.cc/150?u=guest"}
        alt="" className={`${compact ? "h-7 w-7" : "h-9 w-9"} shrink-0 rounded-full border border-white/15 object-cover`} />
      <div className="flex-1">
        {!user && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            className="mb-2 w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan/50" />
        )}
        <textarea rows={compact ? 1 : 2} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan/50" />
        {body.trim() && (
          <div className="mt-2 flex items-center justify-end gap-2">
            {!user && <span className="mr-auto text-[11px] text-white/40">Commenting as guest</span>}
            <button onClick={() => setBody("")} className="rounded-full px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">Cancel</button>
            <button onClick={submit} disabled={busy}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50">
              {busy ? "Posting…" : "Comment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ c, contentId, ownerId, refresh }: {
  c: CommentT; contentId: string; ownerId: string; refresh: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(c.is_liked);
  const [likeCount, setLikeCount] = useState(c.like_count);
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replies, setReplies] = useState<CommentT[] | null>(null);
  const perms = canModerate(user, c, ownerId);

  const like = async () => {
    setLiked((v) => !v); setLikeCount((n) => (liked ? n - 1 : n + 1));
    try {
      const r = await api<{ liked: boolean; like_count: number }>(`/api/comments/${c.id}/like`, { method: "POST" });
      setLiked(r.liked); setLikeCount(r.like_count);
    } catch (e) {
      setLiked(c.is_liked); setLikeCount(c.like_count);
      if ((e as ApiError).status === 401) router.push("/login");
    }
  };

  const loadReplies = async () => {
    setShowReplies((v) => !v);
    if (!replies) {
      try { setReplies(await apiGet<CommentT[]>(`/api/comments/${c.id}/replies`)); } catch { setReplies([]); }
    }
  };

  const addReply = async (body: string, anonName?: string) => {
    await api(`/api/content/${contentId}/comments`, { method: "POST", json: { body, parent_id: c.id, anon_name: anonName } });
    setReplies(await apiGet<CommentT[]>(`/api/comments/${c.id}/replies`));
    setShowReplies(true); setReplyOpen(false); refresh();
  };

  const del = async () => {
    if (!confirm("Delete this comment?")) return;
    try { await api(`/api/comments/${c.id}`, { method: "DELETE" }); refresh(); } catch { /* ignore */ }
  };
  const pin = async () => { try { await api(`/api/comments/${c.id}/pin`, { method: "POST" }); refresh(); } catch { /* ignore */ } };

  return (
    <div className="flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.author.avatar} alt={c.author.name} className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover" />
      <div className="min-w-0 flex-1">
        {c.is_pinned && <div className="mb-0.5 flex items-center gap-1 text-[11px] text-white/40"><Pin size={11} /> Pinned</div>}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white">{c.author.name}</span>
          {c.author.verified && <CheckCircle size={12} className="text-cyan" />}
          <span className="text-xs text-white/40">{c.time_ago}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-white/80">{c.body}</p>
        <div className="mt-1.5 flex items-center gap-4 text-white/50">
          <button onClick={like} className="flex items-center gap-1 text-xs hover:text-white">
            <ThumbsUp size={14} className={liked ? "fill-white text-white" : ""} /> {likeCount > 0 ? fmtCount(likeCount) : ""}
          </button>
          {!c.parent_id && <button onClick={() => setReplyOpen((v) => !v)} className="text-xs font-medium hover:text-white">Reply</button>}
          {perms.pin && !c.parent_id && <button onClick={pin} className="text-xs hover:text-white" title="Pin"><Pin size={13} /></button>}
          {perms.del && <button onClick={del} className="text-xs hover:text-rose" title="Delete"><Trash2 size={13} /></button>}
        </div>

        {replyOpen && <div className="mt-3"><CommentBox compact placeholder={`Reply to ${c.author.name}…`} onSubmit={addReply} /></div>}

        {c.reply_count > 0 && (
          <button onClick={loadReplies} className="mt-2 text-xs font-semibold text-cyan hover:underline">
            {showReplies ? "Hide" : "View"} {c.reply_count} {c.reply_count === 1 ? "reply" : "replies"}
          </button>
        )}

        {showReplies && replies && (
          <div className="mt-3 flex flex-col gap-4 border-l border-white/5 pl-3">
            {replies.map((r) => (
              <CommentItem key={r.id} c={r} contentId={contentId} ownerId={ownerId}
                refresh={async () => { setReplies(await apiGet<CommentT[]>(`/api/comments/${c.id}/replies`)); refresh(); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Comments({ contentId, ownerId, count }: { contentId: string; ownerId: string; count: number; }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [sort, setSort] = useState<"top" | "new">("top");

  const { data, isLoading } = useQuery({
    queryKey: ["comments", contentId, sort, user?.id ?? "anon"],
    queryFn: () => apiGet<CommentT[]>(`/api/content/${contentId}/comments?sort=${sort}`),
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["comments", contentId] });

  useEffect(() => {
    const ch = supabase
      .channel(`comments-${contentId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `content_id=eq.${contentId}` },
        () => qc.invalidateQueries({ queryKey: ["comments", contentId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [contentId, qc]);

  const addComment = async (body: string, anonName?: string) => {
    await api(`/api/content/${contentId}/comments`, { method: "POST", json: { body, anon_name: anonName } });
    refresh();
  };

  return (
    <div className="mt-6 px-4 sm:px-0">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="text-base font-bold text-white">{fmtCount(count)} Comments</h2>
        <div className="flex gap-1 text-xs">
          {(["top", "new"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={`rounded-full px-3 py-1 font-medium ${sort === s ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
              {s === "top" ? "Top" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6"><CommentBox placeholder="Add a comment…" onSubmit={addComment} /></div>

      {isLoading ? (
        <p className="text-sm text-white/40">Loading comments…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-white/40">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-5">
          {data.map((c) => <CommentItem key={c.id} c={c} contentId={contentId} ownerId={ownerId} refresh={refresh} />)}
        </div>
      )}
    </div>
  );
}
