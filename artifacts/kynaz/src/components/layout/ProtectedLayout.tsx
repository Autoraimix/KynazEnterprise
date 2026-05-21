import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { PageTransition } from "../PageTransition";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/Kynaz_Enterprise_Logo_1778916756969.jpeg";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 border-b border-border bg-background flex items-center px-4 sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar userRole={user.role} />
            </SheetContent>
          </Sheet>
          <img src={logoUrl} alt="Kynaz Enterprise" className="ml-4 h-8 w-auto object-contain" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
