"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare, Search, Smile, ThumbsUp } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useFeature } from "@/lib/use-features";

interface Conversation {
  id: string;
  other: { id: string; name: string; avatar: string };
  last_message: string;
  last_at: string;
  unread: number;
}
interface Msg { id: string; sender_id: string; body: string; created_at: string; }

const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "😮", "😢", "😅", "👍", "🙏", "🔥", "❤️", "🎉", "💯", "👏", "🤔"];

function shortTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

function ChatPane({ conv, meId, onBack, isOnline }: { conv: Conversation; meId: string; onBack: () => void; isOnline: boolean }) {
  const convId = conv.id;
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: msgs } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => apiGet<Msg[]>(`/api/conversations/${convId}/messages`),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`conv-${convId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        () => { qc.invalidateQueries({ queryKey: ["messages", convId] }); qc.invalidateQueries({ queryKey: ["conversations"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, qc]);

  useEffect(() => {
    api(`/api/conversations/${convId}/read`, { method: "POST" }).catch(() => {});
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }, [convId, msgs?.length, qc]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs?.length]);

  const send = async (override?: string) => {
    const body = (override ?? text).trim();
    if (!body) return;
    setText(""); setShowEmoji(false);
    try {
      await api(`/api/conversations/${convId}/messages`, { method: "POST", json: { body } });
      qc.invalidateQueries({ queryKey: ["messages", convId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch { /* */ }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-white/5 px-4">
        <button onClick={onBack} className="text-cyan hover:opacity-80 sm:hidden"><ArrowLeft size={22} /></button>
        <Link href={`/channel/${conv.other.id}`} className="flex items-center gap-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conv.other.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0a0f] bg-green-500" />}
          </div>
          <div>
            <p className="font-semibold leading-tight text-white">{conv.other.name}</p>
            <p className="text-xs text-white/40">{isOnline ? "Active now" : "Offline"}</p>
          </div>
        </Link>
      </div>

      {/* messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 hide-scrollbar">
        <div className="flex flex-col gap-1">
          {(msgs ?? []).map((m, idx) => {
            const mine = m.sender_id === meId;
            const arr = msgs ?? [];
            const showAvatar = !mine && (idx === arr.length - 1 || arr[idx + 1]?.sender_id !== m.sender_id);
            const isLike = m.body === "👍";
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (showAvatar
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.other.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                  : <div className="w-6 shrink-0" />)}
                {isLike ? (
                  <div className="text-4xl">👍</div>
                ) : (
                  <div className={`max-w-[68%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-gradient-to-br from-cyan-600 to-violet-600 text-white" : "bg-white/10 text-white/90"}`}>
                    {m.body}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* emoji panel */}
      {showEmoji && (
        <div className="flex flex-wrap gap-1 border-t border-white/5 px-3 py-2">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setText((t) => t + e)} className="rounded-lg p-1.5 text-xl hover:bg-white/10">{e}</button>
          ))}
        </div>
      )}

      {/* input */}
      <div className="flex items-center gap-2 border-t border-white/5 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <button onClick={() => setShowEmoji((s) => !s)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10 ${showEmoji ? "text-cyan" : "text-white/50"}`}><Smile size={20} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Aa" className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan/50" />
        {text.trim() ? (
          <button onClick={() => send()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-white/90"><Send size={16} /></button>
        ) : (
          <button onClick={() => send("👍")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cyan hover:bg-white/10"><ThumbsUp size={20} className="fill-cyan" /></button>
        )}
      </div>
    </div>
  );
}

function MessagesInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const enabled = useFeature("messages");
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(params.get("c"));
  const [q, setQ] = useState("");
  const [online, setOnline] = useState<Set<string>>(new Set());

  const { data: convs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet<Conversation[]>("/api/conversations"),
    refetchInterval: 20000,
    enabled: !!user && enabled,
  });

  // conversation-list realtime
  useEffect(() => {
    if (!user || !enabled) return;
    const ch = supabase.channel("conv-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["conversations"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled, qc]);

  // presence — who's online (active/inactive)
  useEffect(() => {
    if (!user || !enabled) return;
    const ch = supabase.channel("presence:online", { config: { presence: { key: user.id } } });
    ch.on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(ch.presenceState()))))
      .subscribe(async (status) => { if (status === "SUBSCRIBED") await ch.track({ at: Date.now() }); });
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled]);

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!enabled) return <div className="px-6 py-16 text-center text-white/50">Messaging is currently disabled.</div>;
  if (!user)
    return (
      <div className="px-6 py-16 text-center">
        <MessageSquare size={28} className="mx-auto mb-3 text-white/40" />
        <p className="text-white/60">Log in to view your messages.</p>
        <button onClick={() => router.push("/login")} className="mt-4 rounded-full bg-white px-6 py-2 font-semibold text-black">Log in</button>
      </div>
    );

  const list = (convs ?? []).filter((c) => c.other.name.toLowerCase().includes(q.trim().toLowerCase()));
  const activeConv = convs?.find((c) => c.id === active) ?? null;

  return (
    <div className="grid h-[calc(100dvh-4rem)] w-full grid-cols-1 overflow-hidden sm:h-[calc(100dvh-5rem)] sm:grid-cols-[360px_minmax(0,1fr)]">
      {/* list */}
      <div className={`flex min-w-0 flex-col border-r border-white/5 ${active ? "hidden sm:flex" : "flex"}`}>
        <div className="px-4 pb-2 pt-4">
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-white">Chats</h1>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
            <Search size={16} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 hide-scrollbar">
          {list.length === 0 ? (
            <p className="px-2 py-6 text-sm text-white/40">No conversations. Message someone from their channel.</p>
          ) : (
            list.map((c) => {
              const unread = c.unread > 0;
              return (
                <button key={c.id} onClick={() => setActive(c.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5 ${active === c.id ? "bg-white/5" : ""}`}>
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.other.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                    {online.has(c.other.id) && <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0f] bg-green-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${unread ? "font-bold text-white" : "font-semibold text-white"}`}>{c.other.name}</p>
                    <div className="flex items-center gap-1 text-[13px]">
                      <p className={`flex-1 truncate ${unread ? "font-semibold text-white" : "text-white/45"}`}>{c.last_message || "New conversation"}</p>
                      <span className="shrink-0 text-white/30">· {shortTime(c.last_at)}</span>
                      {unread && <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* chat */}
      <div className={`min-w-0 ${active ? "flex" : "hidden sm:flex sm:items-center sm:justify-center"}`}>
        {activeConv ? (
          <ChatPane conv={activeConv} meId={user.id} onBack={() => setActive(null)} isOnline={online.has(activeConv.other.id)} />
        ) : (
          <div className="text-center text-white/40">
            <MessageSquare size={40} className="mx-auto mb-3 text-white/20" />
            <p className="text-sm">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-white/50">Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
