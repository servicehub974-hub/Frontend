"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare, Info } from "lucide-react";
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

// সময় সুন্দরভাবে দেখানোর জন্য ছোট একটি হেল্পার ফাংশন
function formatTime(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatPane({ conv, meId, onBack }: { conv: Conversation; meId: string; onBack: () => void }) {
  const convId = conv.id;
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: msgs } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => apiGet<Msg[]>(`/api/conversations/${convId}/messages`),
    refetchInterval: 6000, 
  });

  // Supabase Realtime
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

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [msgs?.length]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // ফর্ম সাবমিট রিলোড বন্ধ করার জন্য
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
    <div className="flex h-full min-h-0 flex-col bg-[#0f0f11] sm:rounded-r-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:rounded-tr-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:hidden">
            <ArrowLeft size={20} />
          </button>
          <Link href={`/channel/${conv.other.id}`} className="group flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conv.other.avatar} alt="" className="h-10 w-10 rounded-full border border-white/10 object-cover transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-white group-hover:underline">{conv.other.name}</span>
              <span className="text-xs text-white/50">View channel</span>
            </div>
          </Link>
        </div>
        <button className="text-white/40 transition-colors hover:text-white">
          <Info size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 hide-scrollbar scroll-smooth">
        <div className="flex flex-col gap-4">
          {(msgs ?? []).map((m, i) => {
            const mine = m.sender_id === meId;
            const showAvatar = !mine && (i === 0 || msgs![i - 1].sender_id !== m.sender_id);
            
            return (
              <div key={m.id} className={`flex items-end gap-2.5 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine ? (
                  showAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.other.avatar} alt="" className="mb-4 h-7 w-7 shrink-0 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-7 shrink-0" /> // Avatar এর জায়গা ফাকা রাখার জন্য
                  )
                ) : null}
                
                <div className={`group flex flex-col ${mine ? "items-end" : "items-start"} max-w-[75%]`}>
                  <div className={`relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                    mine 
                      ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-cyan-600 to-blue-600 text-white" 
                      : "rounded-2xl rounded-bl-sm bg-white/10 text-white/95"
                  }`}>
                    {m.body}
                  </div>
                  <span className="mt-1 text-[10px] font-medium text-white/30 opacity-0 transition-opacity group-hover:opacity-100">
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <form 
          onSubmit={send}
          className="flex items-end gap-2 rounded-3xl border border-white/10 bg-white/5 p-1.5 transition-colors focus-within:border-cyan-500/50 focus-within:bg-white/[0.07]"
        >
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message..." 
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-4 py-2.5 text-[15px] text-white outline-none placeholder:text-white/30 hide-scrollbar" 
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white transition-all hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30"
          >
            <Send size={18} className={text.trim() ? "ml-0.5" : ""} />
          </button>
        </form>
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

  // Realtime update list
  useEffect(() => {
    if (!user || !enabled) return;
    const ch = supabase
      .channel("conv-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["conversations"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled, qc]);

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
    </div>
  );
  
  if (!enabled) return (
    <div className="flex h-[50vh] items-center justify-center text-white/50">
      Messaging is currently disabled.
    </div>
  );
  
  if (!user) return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <MessageSquare size={32} className="text-white/40" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Your Messages</h2>
        <p className="mb-8 max-w-sm text-[15px] text-white/50">Log in to chat with creators and view your conversation history.</p>
        <button onClick={() => router.push("/login")} className="rounded-full bg-white px-8 py-2.5 font-semibold text-black transition-transform hover:scale-105 active:scale-95">
          Log in
        </button>
      </div>
    );

  const activeConv = convs?.find((c) => c.id === active) ?? null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-6xl overflow-hidden sm:h-[calc(100dvh-5rem)] sm:p-4">
      <div className="flex w-full flex-col overflow-hidden sm:flex-row sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.01] sm:shadow-2xl">
        
        {/* Sidebar List */}
        <div className={`flex w-full flex-col border-r border-white/10 bg-[#0a0a0c] sm:w-[340px] sm:shrink-0 ${active ? "hidden sm:flex" : "flex"}`}>
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="text-xl font-bold text-white">Chats</h1>
            {/* Optional: Add a new chat button or settings icon here */}
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {!convs || convs.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <MessageSquare size={24} className="mb-3 text-white/20" />
                <p className="text-[14px] text-white/40">No conversations yet.<br/>Message a creator from their channel.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-2">
                {convs.map((c) => (
                  <button key={c.id} onClick={() => setActive(c.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      active === c.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="relative shrink-0">
                      <img src={c.other.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                      {c.unread > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0c] bg-cyan-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-white">{c.other.name}</p>
                        <span className="shrink-0 text-[11px] text-white/40">
                          {formatTime(c.last_at) || ""}
                        </span>
                      </div>
                      <p className={`truncate text-[13px] ${c.unread ? "font-medium text-white/90" : "text-white/50"}`}>
                        {c.last_message || "Started a conversation"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Pane */}
        <div className={`min-w-0 flex-1 bg-[#0f0f11] ${active ? "flex" : "hidden sm:flex"}`}>
          {activeConv ? (
            <ChatPane conv={activeConv} meId={user.id} onBack={() => setActive(null)} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <MessageSquare size={28} className="text-white/20" />
              </div>
              <p className="text-lg font-medium text-white/80">Your Messages</p>
              <p className="mt-1 text-sm text-white/40">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  );
}
