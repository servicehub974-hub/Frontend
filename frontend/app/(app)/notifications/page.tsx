"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, UserPlus, MessageSquare, ThumbsUp, CornerDownRight, Sparkles } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";

interface Notif { id: string; type: string; actor_name: string | null; message: string; link: string | null; image: string | null; is_read: boolean; time_ago: string; }

function icon(type: string) {
  if (type === "follow") return <UserPlus size={18} className="text-cyan" />;
  if (type === "comment") return <MessageSquare size={18} className="text-cyan" />;
  if (type === "reply") return <CornerDownRight size={18} className="text-cyan" />;
  if (type === "comment_like") return <ThumbsUp size={18} className="text-fuchsia" />;
  return <Sparkles size={18} className="text-gold" />;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<Notif[]>("/api/notifications"),
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Log in to see your notifications.</div>;

  const open = async (n: Notif) => {
    if (!n.is_read) { try { await api(`/api/notifications/${n.id}/read`, { method: "POST" }); } catch { /* */ } qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notif-unread"] }); }
    if (n.link) router.push(n.link);
  };
  const readAll = async () => { try { await api("/api/notifications/read-all", { method: "POST" }); } catch { /* */ } qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notif-unread"] }); };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white"><Bell size={24} className="text-cyan" /> Notifications</h1>
        <button onClick={readAll} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/15">Mark all read</button>
      </div>

      {isLoading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-white/40">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {data.map((n) => (
            <button key={n.id} onClick={() => open(n)}
              className={`flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/5 ${n.is_read ? "" : "bg-white/[0.04]"}`}>
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">{icon(n.type)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/90"><span className="font-semibold text-white">{n.actor_name}</span> {n.message}</p>
                <p className="mt-0.5 text-xs text-white/40">{n.time_ago}</p>
              </div>
              {n.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
              )}
              {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
