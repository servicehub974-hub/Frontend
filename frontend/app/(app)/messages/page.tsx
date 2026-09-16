"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Send, MessageSquare, Info, MoreHorizontal, Edit, 
  Search, Phone, Video, PlusCircle, ImageIcon, Smile, ThumbsUp,
  Sticker
} from "lucide-react";
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

// সাইডবারের জন্য শট টাইম ফরম্যাট (যেমন: 8h, 1w)
function formatShortTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return `${Math.floor(diffInSeconds / 604800)}w`;
}

// চ্যাটের মাঝখানে ডিভাইডারের জন্য টাইম ফরম্যাট (যেমন: Tue 8:17 PM)
function formatMessageTime(dateString?: string) {
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

  const send = async (e?: React.FormEvent, isLike = false) => {
    if (e) e.preventDefault();
    const body = isLike ? "👍" : text.trim();
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
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0f0f11] px-4 py-2.5 sm:rounded-tr-2xl shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 sm:hidden">
            <ArrowLeft size={20} />
          </button>
          <Link href={`/channel/${conv.other.id}`} className="flex items-center gap-3 group">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={conv.other.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0f0f11] bg-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-white group-hover:underline">{conv.other.name}</span>
              <span className="text-xs text-white/50">Active now</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-[#a344ff]"> {/* মেসেঞ্জারের মতো পার্পল আইকন */}
          <Phone size={22} className="cursor-pointer transition-transform hover:scale-110" />
          <Video size={24} className="cursor-pointer transition-transform hover:scale-110" />
          <Info size={22} className="cursor-pointer transition-transform hover:scale-110" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 hide-scrollbar">
        <div className="flex flex-col">
          {(msgs ?? []).map((m, i) => {
            const mine = m.sender_id === meId;
            const nextMsg = msgs![i + 1];
            const prevMsg = msgs![i - 1];
            
            // মেসেজ গ্রুপিং লজিক
            const isFirstInGroup = prevMsg?.sender_id !== m.sender_id;
            const isLastInGroup = nextMsg?.sender_id !== m.sender_id;
            
            // বর্ডার রেডিয়াস লজিক (মেসেঞ্জারের মতো)
            let roundedClass = "rounded-2xl";
            if (mine) {
              if (!isFirstInGroup) roundedClass += " rounded-tr-[5px]";
              if (!isLastInGroup) roundedClass += " rounded-br-[5px]";
            } else {
              if (!isFirstInGroup) roundedClass += " rounded-tl-[5px]";
              if (!isLastInGroup) roundedClass += " rounded-bl-[5px]";
            }

            return (
              <div key={m.id} className={`flex w-full flex-col ${isLastInGroup ? "mb-4" : "mb-0.5"}`}>
                
                {/* Time Divider (show randomly or at first of group - simple logic for now) */}
                {isFirstInGroup && (
                  <div className="my-3 text-center text-xs text-white/40 font-medium">
                    {formatMessageTime(m.created_at)}
                  </div>
                )}

                <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine ? (
                    <div className="w-7 shrink-0">
                      {isLastInGroup && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={conv.other.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                      )}
                    </div>
                  ) : null}
                  
                  <div className={`group relative max-w-[70%] px-3.5 py-2 text-[15px] ${roundedClass} ${
                    mine 
                      ? "bg-[#8124ff] text-white" // Messenger style purple
                      : "bg-white/10 text-white/95"
                  }`}>
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2.5 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {/* Left Action Icons */}
        <div className="flex shrink-0 items-center gap-3 pb-2 text-[#a344ff]">
          <PlusCircle size={22} className="cursor-pointer hover:text-[#b465ff]" />
          <ImageIcon size={22} className="cursor-pointer hover:text-[#b465ff] hidden sm:block" />
          <Sticker size={22} className="cursor-pointer hover:text-[#b465ff] hidden sm:block" />
        </div>

        {/* Input Box */}
        <div className="flex-1 flex items-end rounded-[20px] bg-white/10 px-3 py-1 transition-colors focus-within:bg-white/15">
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Aa" 
            rows={1}
            className="max-h-32 min-h-[36px] w-full resize-none bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-white/40 hide-scrollbar" 
          />
          <button className="shrink-0 p-1.5 text-[#a344ff] hover:text-[#b465ff]">
            <Smile size={22} />
          </button>
        </div>

        {/* Right Action Icon (Like / Send) */}
        <button 
          onClick={(e) => send(e, !text.trim())}
          className="shrink-0 pb-1.5 text-[#a344ff] transition-transform hover:scale-110 active:scale-95"
        >
          {text.trim() ? <Send size={24} /> : <ThumbsUp size={24} />}
        </button>
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
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#a344ff] border-t-transparent"></div>
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
      <button onClick={() => router.push("/login")} className="rounded-full bg-white px-8 py-2.5 font-semibold text-black">
        Log in
      </button>
    </div>
  );

  const activeConv = convs?.find((c) => c.id === active) ?? null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1400px] overflow-hidden sm:h-[calc(100dvh-4.5rem)] sm:p-4">
      <div className="flex w-full flex-col overflow-hidden sm:flex-row sm:rounded-2xl sm:border sm:border-white/10 sm:bg-black sm:shadow-2xl">
        
        {/* Sidebar List */}
        <div className={`flex w-full flex-col border-r border-white/5 bg-[#0a0a0c] sm:w-[360px] sm:shrink-0 ${active ? "hidden sm:flex" : "flex"}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h1 className="text-[24px] font-bold text-white">Chats</h1>
            <div className="flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <MoreHorizontal size={20} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <Edit size={18} />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center rounded-full bg-white/10 px-3 py-2">
              <Search size={18} className="text-white/40" />
              <input 
                type="text" 
                placeholder="Search Messenger" 
                className="ml-2 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" 
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 hide-scrollbar">
            <button className="rounded-full bg-[#1c1c1e] bg-white/10 px-3.5 py-1.5 text-[14px] font-medium text-white transition-colors hover:bg-white/20">
              All
            </button>
            <button className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/5">
              Unread
            </button>
            <button className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/5">
              Groups
            </button>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 hide-scrollbar">
            {!convs || convs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                No conversations yet. Message someone to start.
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {convs.map((c) => (
                  <button key={c.id} onClick={() => setActive(c.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-all ${
                      active === c.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.other.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0c] bg-green-500" />
                    </div>

                    {/* Text content */}
                    <div className="min-w-0 flex-1 py-1">
                      <p className="truncate text-[15px] font-medium text-white">{c.other.name}</p>
                      <div className="flex items-center gap-1 text-[13px]">
                        <p className={`truncate ${c.unread ? "font-semibold text-white" : "text-white/50"}`}>
                          {c.last_message || "Started a conversation"}
                        </p>
                        <span className="shrink-0 text-white/50">·</span>
                        <span className="shrink-0 text-white/50">{formatShortTime(c.last_at)}</span>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {c.unread > 0 && (
                      <div className="shrink-0 pr-2">
                        <span className="block h-3 w-3 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Pane Area */}
        <div className={`min-w-0 flex-1 bg-[#0f0f11] ${active ? "flex" : "hidden sm:flex"}`}>
          {activeConv ? (
            <ChatPane conv={activeConv} meId={user.id} onBack={() => setActive(null)} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <MessageSquare size={48} className="mb-4 text-white/10" />
              <p className="text-xl font-semibold text-white/80">Select a chat</p>
              <p className="mt-1 text-[15px] text-white/40">Choose from your existing conversations or start a new one.</p>
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#a344ff] border-t-transparent"></div>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  );
}
