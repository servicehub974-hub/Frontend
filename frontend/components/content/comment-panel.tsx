"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Comments } from "./comments";

export function CommentPanel({ contentId, ownerId, count, onClose }: {
  contentId: string; ownerId: string; count: number; onClose: () => void;
}) {
  const [el] = useState(() => (typeof document !== "undefined" ? document.createElement("div") : null));
  useEffect(() => {
    if (!el) return;
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";
    return () => { document.body.removeChild(el); document.body.style.overflow = ""; };
  }, [el]);
  if (!el) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-[201] flex flex-col bg-[#0d0d12] shadow-2xl
        inset-x-0 bottom-0 h-[78vh] rounded-t-2xl
        sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[420px] sm:rounded-none sm:border-l sm:border-white/10">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="font-semibold text-white">Comments{count ? ` · ${count}` : ""}</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 hide-scrollbar">
          <Comments contentId={contentId} ownerId={ownerId} count={count} />
        </div>
      </div>
    </>,
    el
  );
}
