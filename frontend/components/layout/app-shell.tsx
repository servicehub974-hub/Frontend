"use client";

import { useEffect, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      if (w >= 640 && w < 1024) setIsCompact(true);
      else if (w >= 1024) setIsCompact(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <Header onToggleSidebar={() => setIsCompact((v) => !v)} />
      <Sidebar isCompact={isCompact} isMobile={isMobile} />
      <MobileBottomNav />

      <main
        className={`flex min-h-screen flex-col pb-24 pt-16 transition-all duration-300 sm:pb-10 sm:pt-20 ${
          isMobile ? "ml-0" : isCompact ? "ml-[72px]" : "ml-64"
        }`}
      >
        {children}
      </main>
    </>
  );
}
