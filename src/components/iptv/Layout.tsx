import { ReactNode } from "react";
import { MobileTabBar, MobileTopBar, Sidebar } from "./Sidebar";
import { PlayerModal } from "./PlayerModal";
import { useTvRemoteNavigation } from "@/hooks/useTvRemoteNavigation";

export function Layout({ children }: { children: ReactNode }) {
  useTvRemoteNavigation();

  return (
    <div className="flex h-screen max-w-full flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <Sidebar />
      <MobileTopBar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:h-full md:pb-8 [overscroll-behavior:contain]">
        {children}
      </main>
      <MobileTabBar />
      <PlayerModal />
    </div>
  );
}
