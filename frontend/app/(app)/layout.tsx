import { AppShell } from "@/components/layout/app-shell";
import { MiniPlayer } from "@/components/content/mini-player";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <MiniPlayer />
    </>
  );
}
