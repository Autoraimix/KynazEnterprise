import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { PageTransition } from "../PageTransition";
import { Menu, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (!isSuperAdmin()) {
        setLocation(user.role === "admin" ? "/admin" : "/dashboard");
      }
    }
  }, [user, isLoading, isSuperAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isSuperAdmin()) return null;

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 border-r border-border bg-sidebar">
        <Sidebar userRole={user.role} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-background flex items-center px-4 sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar">
              <Sidebar userRole={user.role} />
            </SheetContent>
          </Sheet>
          <div className="ml-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-500" />
            <span className="font-serif font-bold text-primary">Super Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
