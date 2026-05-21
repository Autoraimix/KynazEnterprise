import { ReactNode } from "react";
import { PublicNavbar } from "./PublicNavbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { PageTransition } from "../PageTransition";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-secondary/30">
      <PublicNavbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
