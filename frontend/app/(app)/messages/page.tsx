"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { api, apiGet } from "@/lib/api";
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

function ChatPane({ convId, meId, onBack }: { convId: string; meId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: msgs } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => apiGet<Msg[]>(`/api/conversations/${convId}/messages`),
    refetchInterval: 2500, // realtime-ish
  });

  const conv = (qc.getQueryData<Conversation[]>(["conversations"]) ?? []).find((c) => c.id === convId);

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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button onClick={onBack} className="text-white/60 hover:text-white sm:hidden"><ArrowLeft size={20} /></button>
        {conv && (
          <Link href={`/channel/${conv.other.id}`} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conv.other.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-semibold text-white">{conv.other.name}</span>
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
        <div className="flex flex-col gap-2">
          {(msgs ?? []).map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                mine ? "self-end bg-gradient-to-br from-cyan-600 to-violet-600 text-white" : "self-start bg-white/10 text-white/90"
              }`}>
                {m.body}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/5 p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…" className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan/50" />
        <button onClick={send} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-white/90"><Send size={16} /></button>
      </div>
    </div>
  );
}

function MessagesInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const enabled = useFeature("messages");
  const [active, setActive] = useState<string | null>(params.get("c"));

  const { data: convs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet<Conversation[]>("/api/conversations"),
    refetchInterval: 5000,
    enabled: !!user && enabled,
  });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!enabled) return <div className="px-6 py-16 text-center text-white/50">Messaging is currently disabled.</div>;
  if (!user) {
    return (
      <div className="px-6 py-16 text-center">
        <MessageSquare size={28} className="mx-auto mb-3 text-white/40" />
        <p className="text-white/60">Log in to view your messages.</p>
        <button onClick={() => router.push("/login")} className="mt-4 rounded-full bg-white px-6 py-2 font-semibold text-black">Log in</button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl overflow-hidden sm:h-[calc(100vh-6rem)] sm:gap-4 sm:px-4">
      {/* Conversation list */}
      <div className={`w-full border-r border-white/5 sm:w-80 sm:shrink-0 ${active ? "hidden sm:block" : "block"}`}>
        <h1 className="px-4 py-3 text-lg font-bold text-white">Chats</h1>
        <div className="overflow-y-auto hide-scrollbar">
          {!convs || convs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-white/40">No conversations yet. Message a creator from their channel.</p>
          ) : (
            convs.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${active === c.id ? "bg-white/5" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.other.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{c.other.name}</p>
                  <p className="truncate text-xs text-white/50">{c.last_message || "New conversation"}</p>
                </div>
                {c.unread > 0 && <span className="h-2.5 w-2.5 rounded-full bg-cyan" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className={`flex-1 ${active ? "block" : "hidden sm:flex sm:items-center sm:justify-center"}`}>
        {active ? (
          <ChatPane convId={active} meId={user.id} onBack={() => setActive(null)} />
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
