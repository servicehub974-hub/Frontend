"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Send, MessageSquare, Search, Smile, ThumbsUp 
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
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return `${Math.floor(diffInSeconds / 604800)}w`;
}

// চ্যাটের মাঝখানে ডিভাইডারের জন্য টাইম ফরম্যাট
function formatMessageTime(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
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
    <div className="flex h-full w-full flex-col bg-[#0f0f11]">
      
      {/* Header - Fixed at Top */}
      <div className="flex-none flex items-center justify-between border-b border-white/5 bg-[#0f0f11] px-4 py-3 shadow-sm z-10 w-full">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors sm:hidden">
            <ArrowLeft size={22} />
          </button>
          <Link className="flex items-center gap-3 group" href={`/channel/${conv.other.id}`}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={conv.other.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0f0f11] bg-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-white group-hover:underline">{conv.other.name}</span>
              <span className="text-[12px] font-medium text-white/50">Active now</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 hide-scrollbar w-full">
        <div className="flex flex-col max-w-4xl mx-auto w-full">
          {(msgs ?? []).map((m, i) => {
            const mine = m.sender_id === meId;
            const nextMsg = msgs![i + 1];
            const prevMsg = msgs![i - 1];
            
            // মেসেজ গ্রুপিং লজিক
            const isFirstInGroup = prevMsg?.sender_id !== m.sender_id;
            const isLastInGroup = nextMsg?.sender_id !== m.sender_id;
            
            // বর্ডার রেডিয়াস লজিক (মেসেঞ্জারের মতো)
            let roundedClass = "rounded-[20px]";
            if (mine) {
              if (!isFirstInGroup) roundedClass += " rounded-tr-[5px]";
              if (!isLastInGroup) roundedClass += " rounded-br-[5px]";
            } else {
              if (!isFirstInGroup) roundedClass += " rounded-tl-[5px]";
              if (!isLastInGroup) roundedClass += " rounded-bl-[5px]";
            }

            return (
              <div key={m.id} className={`flex w-full flex-col ${isLastInGroup ? "mb-4" : "mb-[2px]"}`}>
                
                {/* Time Divider */}
                {isFirstInGroup && (
                  <div className="my-3 text-center text-[12px] text-white/40 font-medium">
                    {formatMessageTime(m.created_at)}
                  </div>
                )}

                <div className={`flex items-end gap-2 w-full ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine ? (
                    <div className="w-8 shrink-0 flex justify-center">
                      {isLastInGroup && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={conv.other.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                      )}
                    </div>
                  ) : null}
                  
                  <div className={`group relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-[15px] ${roundedClass} ${
                    mine 
                      ? "bg-[#8124ff] text-white" 
                      : "bg-[#2a2a2b] text-[#e4e6eb]"
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

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-none w-full bg-[#0f0f11] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] border-t border-transparent">
        <div className="max-w-4xl mx-auto w-full flex items-end gap-3">

          {/* Input Box */}
          <div className="flex-1 flex items-end rounded-[20px] bg-[#2a2a2b] px-3 py-1 transition-colors focus-within:bg-[#343435]">
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
              className="max-h-32 min-h-[36px] w-full resize-none bg-transparent py-2 text-[15px] text-[#e4e6eb] outline-none placeholder:text-white/40 hide-scrollbar" 
            />
            <button className="shrink-0 p-1.5 text-[#a344ff] hover:text-[#b465ff] transition-colors">
              <Smile size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Right Action Icon (Like / Send) */}
          <button 
            onClick={(e) => send(e, !text.trim())}
            className="shrink-0 pb-1.5 text-[#a344ff] transition-transform hover:scale-110 active:scale-95"
          >
            {text.trim() ? <Send size={24} strokeWidth={2} /> : <ThumbsUp size={24} strokeWidth={2} />}
          </button>
        </div>
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
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0c]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#a344ff] border-t-transparent"></div>
    </div>
  );
  
  if (!enabled) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0c] text-white/50">
      Messaging is currently disabled.
    </div>
  );
  
  if (!user) return (
    <div className="flex h-screen w-full flex-col items-center justify-center px-6 text-center bg-[#0a0a0c]">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
        <MessageSquare className="text-white/40" size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-white">Your Messages</h2>
      <p className="mb-8 max-w-sm text-[16px] text-white/50">Log in to chat with creators and view your conversation history.</p>
      <button onClick={() => router.push("/login")} className="rounded-full bg-white px-8 py-3 font-semibold text-black transition-transform hover:scale-105">
        Log in
      </button>
    </div>
  );

  return (
    // মূল কনটেইনার: ফুল পেজ স্ক্রল বন্ধ করার জন্য h-[calc(100vh-64px)] এবং overflow-hidden যুক্ত করা হয়েছে
    <div 
      className="flex w-full overflow-hidden bg-[#0a0a0c]"
      style={{ height: "calc(100dvh - 64px)" }} // Ensure your navbar height is accounted for (typically 64px)
    >
      <div className="flex w-full h-full overflow-hidden">
        
        {/* Sidebar List - Flex column structure ensuring inner scroll */}
        <div className={`flex flex-col border-r border-white/5 bg-[#0a0a0c] w-full sm:w-[360px] lg:w-[400px] sm:shrink-0 h-full ${active ? "hidden sm:flex" : "flex"}`}>
          
          {/* Sidebar Header */}
          <div className="flex-none flex items-center justify-between px-4 pt-5 pb-3">
            <h1 className="text-[24px] font-bold text-white tracking-tight">Chats</h1>
          </div>
          
          {/* Search Bar */}
          <div className="flex-none px-4 pb-4">
            <div className="flex items-center rounded-full bg-[#2a2a2b] px-3 py-2 transition-colors focus-within:bg-[#3a3a3b]">
              <Search className="text-[#8e8e93] shrink-0" size={18} />
              <input 
                type="text" 
                placeholder="Search Messenger" 
                className="ml-2 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#8e8e93]" 
              />
            </div>
          </div>
          
          {/* Conversation List - Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-2 hide-scrollbar pb-4">
            {!convs || convs.length === 0 ? (
              <div className="px-4 py-8 text-center text-[15px] text-white/40">
                No conversations yet. Message someone to start.
              </div>
            ) : (
              <div className="flex flex-col gap-[2px]">
                {convs.map((c) => (
                  <button key={c.id} onClick={() => setActive(c.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left transition-colors ${
                      active === c.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.other.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                      <div className="absolute bottom-[2px] right-[2px] h-[14px] w-[14px] rounded-full border-2 border-[#0a0a0c] bg-green-500" />
                    </div>

                    {/* Text content */}
                    <div className="min-w-0 flex-1 py-1">
                      <p className="truncate text-[15px] font-medium text-[#e4e6eb]">{c.other.name}</p>
                      <div className="flex items-center gap-1 text-[13px] mt-[2px]">
                        <p className={`truncate ${c.unread ? "font-semibold text-white" : "text-[#8e8e93]"}`}>
                          {c.last_message || "Started a conversation"}
                        </p>
                        <span className="shrink-0 text-[#8e8e93] px-0.5">·</span>
                        <span className="shrink-0 text-[#8e8e93]">{formatShortTime(c.last_at)}</span>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {c.unread > 0 && (
                      <div className="shrink-0 pr-2">
                        <span className="block h-3 w-3 rounded-full bg-[#2e89ff]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Pane Container */}
        <div className={`min-w-0 flex-1 bg-[#0f0f11] h-full ${active ? "flex" : "hidden sm:flex"}`}>
          {activeConv ? (
            <ChatPane conv={activeConv} meId={user.id} onBack={() => setActive(null)} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center bg-[#0f0f11]">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white/5 mb-6">
                <MessageSquare className="text-white/20" size={40} />
              </div>
              <p className="text-2xl font-semibold text-white/80">Select a chat</p>
              <p className="mt-2 text-[16px] text-white/40 max-w-sm">Choose from your existing conversations or start a new one.</p>
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
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#a344ff] border-t-transparent"></div>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  );
}
