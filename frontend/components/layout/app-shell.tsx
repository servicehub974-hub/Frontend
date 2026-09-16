"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-nav";
import { ProfileMenu } from "./profile-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const mobile = w < 640;
      setIsMobile(mobile);
      if (mobile) setDrawerOpen(false);
      if (w >= 640 && w < 1024) setIsCompact(true);
      else if (w >= 1024) setIsCompact(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close overlays on navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const onToggleSidebar = () => {
    if (isMobile) setDrawerOpen((v) => !v);
    else setIsCompact((v) => !v);
  };

  return (
    <>
      <Header
        onToggleSidebar={onToggleSidebar}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <Sidebar
        isCompact={isCompact}
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <MobileBottomNav onProfile={() => setProfileOpen(true)} />
      <ProfileMenu open={profileOpen} onClose={() => setProfileOpen(false)} />

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
