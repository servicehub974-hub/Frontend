"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/ui/empty-state";

interface F { id: string; name: string; avatar: string; verified: boolean; }

export default function FollowingPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: () => apiGet<F[]>(`/api/users/${user!.id}/following`),
    enabled: !!user,
  });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Log in to see who you follow.</div>;

  const unfollow = async (id: string) => {
    try { await api(`/api/users/${id}/follow`, { method: "POST" }); qc.invalidateQueries({ queryKey: ["following", user.id] }); } catch { /* */ }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader icon={Users} title="Following" />
      {!data ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : data.length === 0 ? (
        <EmptyState icon={Users} title="Not following anyone yet" subtitle="Creators you follow will show up here." />
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {data.map((f) => (
            <div key={f.id} className="flex items-center gap-3 py-3">
              <Link href={`/channel/${f.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
              </Link>
              <Link href={`/channel/${f.id}`} className="flex flex-1 items-center gap-1 text-sm font-semibold text-white hover:underline">
                {f.name} {f.verified && <CheckCircle size={13} className="text-cyan" />}
              </Link>
              <button onClick={() => unfollow(f.id)} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/15">Following</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
