import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { PageTransition } from "../PageTransition";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/Kynaz_Enterprise_Logo_1778916756969.jpeg";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      <div className="hidden md:block w-64 shrink-0 border-r border-border bg-background">
        <Sidebar userRole={user.role} />
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar userRole={user.role} onNavClick={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 border-b border-border bg-background flex items-center px-4 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
          <img src={logoUrl} alt="Kynaz Enterprise" className="ml-4 h-8 w-auto object-contain" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
