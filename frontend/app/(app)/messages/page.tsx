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
    <div className="flex h-full w-full flex-col bg-deep">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4">
        <button onClick={onBack} className="text-cyan hover:opacity-80 sm:hidden"><ArrowLeft size={24} /></button>
        <Link href={`/channel/${conv.other.id}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conv.other.avatar} alt="" className="h-10 w-10 rounded-full border border-white/10 object-cover" />
            {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-deep bg-green-500" />}
          </div>
          <div>
            <p className="font-semibold leading-tight text-white">{conv.other.name}</p>
            <p className="text-xs text-white/50">{isOnline ? "Active now" : "Offline"}</p>
          </div>
        </Link>
      </div>

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto bg-deep px-4 py-4">
        <div className="flex flex-col gap-1.5">
          {(msgs ?? []).map((m, idx) => {
            const mine = m.sender_id === meId;
            const arr = msgs ?? [];
            const showAvatar = !mine && (idx === arr.length - 1 || arr[idx + 1]?.sender_id !== m.sender_id);
            const isLike = m.body === "👍";
            const isSequence = idx > 0 && arr[idx - 1]?.sender_id === m.sender_id;
            return (
              <div key={m.id} className={`flex w-full items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${isSequence ? "mt-0" : "mt-2"}`}>
                {!mine && (showAvatar
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.other.avatar} alt="" className="mb-0.5 h-7 w-7 shrink-0 rounded-full border border-white/10 object-cover" />
                  : <div className="w-7 shrink-0" />)}
                {isLike ? (
                  <div className="cursor-pointer text-4xl drop-shadow-lg transition-transform hover:scale-110">👍</div>
                ) : (
                  <div className={`max-w-[75%] whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-tight shadow-sm md:max-w-[65%]
                    ${mine ? `rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white ${isSequence ? "rounded-tr-sm" : ""}` : `rounded-2xl bg-white/10 text-white ${isSequence ? "rounded-tl-sm" : ""}`}`}>
                    {m.body}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {showEmoji && (
        <div className="flex flex-wrap gap-2 border-t border-white/5 bg-white/[0.03] px-4 py-3 shadow-lg">
          {EMOJIS.map((e) => <button key={e} onClick={() => setText((t) => t + e)} className="rounded-lg p-1.5 text-2xl transition-colors hover:bg-white/10">{e}</button>)}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 border-t border-white/5 bg-white/[0.03] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <button onClick={() => setShowEmoji((s) => !s)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 ${showEmoji ? "text-cyan" : "text-white/50"}`}><Smile size={22} /></button>
        <div className="flex flex-1 items-center rounded-full border border-transparent bg-white/5 pr-1 transition-colors focus-within:border-cyan/50">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Aa" className="w-full bg-transparent px-4 py-2.5 text-[15px] text-white outline-none placeholder:text-white/40" />
        </div>
        {text.trim() ? (
          <button onClick={() => send()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-md transition-opacity hover:opacity-90"><Send size={18} className="ml-1" /></button>
        ) : (
          <button onClick={() => send("👍")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cyan transition-colors hover:bg-white/10"><ThumbsUp size={24} className="fill-cyan" /></button>
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

  useEffect(() => {
    if (!user || !enabled) return;
    const ch = supabase.channel("conv-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["conversations"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled, qc]);

  useEffect(() => {
    if (!user || !enabled) return;
    const ch = supabase.channel("presence:online", { config: { presence: { key: user.id } } });
    ch.on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(ch.presenceState()))))
      .subscribe(async (status) => { if (status === "SUBSCRIBED") await ch.track({ at: Date.now() }); });
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled]);

  if (loading) return <div className="flex h-screen items-center justify-center text-white/40">Loading messages…</div>;
  if (!enabled) return <div className="flex h-screen items-center justify-center text-white/40">Messaging is currently disabled.</div>;
  if (!user)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-deep px-6 text-center">
        <MessageSquare size={48} className="mb-4 text-white/20" />
        <h2 className="mb-2 text-xl font-semibold text-white/90">Welcome to Messages</h2>
        <p className="mb-6 max-w-sm text-white/40">Log in to chat with your friends and connections.</p>
        <button onClick={() => router.push("/login")} className="rounded-full bg-white px-8 py-2.5 font-semibold text-black transition-colors hover:bg-white/90">Log in</button>
      </div>
    );

  const list = (convs ?? []).filter((c) => c.other.name.toLowerCase().includes(q.trim().toLowerCase()));
  const activeConv = convs?.find((c) => c.id === active) ?? null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-deep pb-16 pt-16 sm:pb-0 sm:pt-20 sm:pl-[72px] lg:pl-64">
      <div className={`flex w-full flex-shrink-0 flex-col border-r border-white/5 bg-deep transition-all duration-300 sm:w-[350px] lg:w-[400px] ${active ? "hidden sm:flex" : "flex"}`}>
        <div className="shrink-0 px-4 pb-2 pt-4">
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">Chats</h1>
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 transition-colors focus-within:border-white/20">
            <Search size={18} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Messenger" className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" />
          </div>
        </div>
        <div className="hide-scrollbar mt-2 flex-1 overflow-y-auto px-2 pb-4">
          {list.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/40"><p>No conversations found.</p></div>
          ) : (
            list.map((c) => {
              const unread = c.unread > 0;
              const isActive = active === c.id;
              return (
                <button key={c.id} onClick={() => setActive(c.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.other.avatar} alt="" className="h-14 w-14 rounded-full border border-white/10 object-cover" />
                    {online.has(c.other.id) && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-deep bg-green-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-baseline justify-between">
                      <p className={`truncate pr-2 text-[15px] ${unread ? "font-bold text-white" : "font-semibold text-white/90"}`}>{c.other.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[13px]">
                      <p className={`flex-1 truncate ${unread ? "font-semibold text-white/90" : "text-white/50"}`}>{c.last_message || "New conversation"}</p>
                      <span className="shrink-0 text-white/40">· {shortTime(c.last_at)}</span>
                      {unread && <span className="ml-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`relative h-full min-w-0 flex-1 flex-col bg-deep ${active ? "flex" : "hidden sm:flex"}`}>
        {activeConv ? (
          <ChatPane conv={activeConv} meId={user.id} onBack={() => setActive(null)} isOnline={online.has(activeConv.other.id)} />
        ) : (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-deep">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/5"><MessageSquare size={48} className="text-white/20" /></div>
            <h2 className="text-xl font-semibold text-white/50">Select a chat to start messaging</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-deep text-white/40">Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
