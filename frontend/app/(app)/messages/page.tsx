"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
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

function ChatPane({ conv, meId, onBack }: { conv: Conversation; meId: string; onBack: () => void }) {
  const convId = conv.id;
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: msgs } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => apiGet<Msg[]>(`/api/conversations/${convId}/messages`),
    refetchInterval: 6000, // fallback; realtime handles instant
  });

  // Supabase Realtime — instant new messages
  useEffect(() => {
    const ch = supabase
      .channel(`conv-${convId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", convId] });
          qc.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, qc]);

  useEffect(() => {
    api(`/api/conversations/${convId}/read`, { method: "POST" }).catch(() => {});
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }, [convId, msgs?.length, qc]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs?.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      await api(`/api/conversations/${convId}/messages`, { method: "POST", json: { body } });
      qc.invalidateQueries({ queryKey: ["messages", convId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch { /* ignore */ }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button onClick={onBack} className="text-white/60 hover:text-white sm:hidden"><ArrowLeft size={20} /></button>
        <Link href={`/channel/${conv.other.id}`} className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={conv.other.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-semibold text-white">{conv.other.name}</span>
        </Link>
      </div>

      {/* messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 hide-scrollbar">
        <div className="flex flex-col gap-2">
          {(msgs ?? []).map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={conv.other.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                )}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-gradient-to-br from-cyan-600 to-violet-600 text-white" : "bg-white/10 text-white/90"
                }`}>
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* input */}
      <div className="flex items-center gap-2 border-t border-white/5 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…" className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan/50" />
        <button onClick={send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-white/90"><Send size={16} /></button>
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

  const { data: convs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet<Conversation[]>("/api/conversations"),
    refetchInterval: 8000,
    enabled: !!user && enabled,
  });

  // Realtime: any new message updates the conversation list
  useEffect(() => {
    if (!user || !enabled) return;
    const ch = supabase
      .channel("conv-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["conversations"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled, qc]);

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

  const activeConv = convs?.find((c) => c.id === active) ?? null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-6xl overflow-hidden sm:h-[calc(100dvh-5rem)] sm:gap-0 sm:px-4 sm:py-3">
      {/* list */}
      <div className={`flex w-full flex-col border-white/5 sm:w-80 sm:shrink-0 sm:rounded-l-2xl sm:border ${active ? "hidden sm:flex" : "flex"}`}>
        <h1 className="border-b border-white/5 px-4 py-4 text-xl font-bold text-white">Chats</h1>
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {!convs || convs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-white/40">No conversations yet. Message a creator from their channel.</p>
          ) : (
            convs.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${active === c.id ? "bg-white/5" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.other.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{c.other.name}</p>
                  <p className={`truncate text-xs ${c.unread ? "font-semibold text-white" : "text-white/50"}`}>{c.last_message || "New conversation"}</p>
                </div>
                {c.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* chat */}
      <div className={`min-w-0 flex-1 border-white/5 sm:rounded-r-2xl sm:border sm:border-l-0 ${active ? "flex" : "hidden sm:flex sm:items-center sm:justify-center"}`}>
        {activeConv ? (
          <ChatPane conv={activeConv} meId={user.id} onBack={() => setActive(null)} />
        ) : (
          <p className="text-sm text-white/40">Select a conversation</p>
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
