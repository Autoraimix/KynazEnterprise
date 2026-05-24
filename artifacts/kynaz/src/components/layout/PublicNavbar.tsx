import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocation as useWouterLocation } from "wouter";

export function PublicNavbar() {
  const [location] = useLocation();
  const [, setLocation] = useWouterLocation();
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
    setIsMobileMenuOpen(false);
  };

  const handleLangToggle = () => {
    const next = lang === "en" ? "bm" : "en";
    toggleLang();
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = next === "bm" ? "ms" : "";
      select.dispatchEvent(new Event("change"));
    }
  };

  const links = [
    { href: "/", labelKey: "nav.home" },
    { href: "/contact", labelKey: "nav.contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="KYNAZ" className="h-11 w-auto object-contain" />
          <span className="font-bold text-xl text-primary hidden sm:inline-block">
            KYNAZ
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-secondary ${
                location === link.href ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleLangToggle}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground"
            title="Toggle language / Tukar bahasa"
          >
            <Globe size={13} />
            {lang === "en" ? "BM" : "EN"}
          </button>

          {user ? (
            <>
              <Link href={user.role === "admin" || user.role === "superadmin" ? "/admin" : user.role === "agent" ? "/agent" : "/dashboard"}>
                <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
                  {t("nav.dashboard")}
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost">{t("nav.logout")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("logout.title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("logout.desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("logout.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-primary text-white hover:bg-primary/90">
                      {t("logout.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">{t("nav.login")}</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {t("nav.register")}
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-lg font-medium p-2 rounded-md ${
                    location === link.href ? "bg-secondary/10 text-secondary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <button
                onClick={() => { handleLangToggle(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-sm font-medium p-2 rounded-md text-muted-foreground hover:bg-muted/50"
              >
                <Globe size={16} />
                {lang === "en" ? "Bahasa Melayu" : "English"}
              </button>
              <div className="h-px bg-border my-2" />
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link href={user.role === "admin" || user.role === "superadmin" ? "/admin" : user.role === "agent" ? "/agent" : "/dashboard"} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start bg-primary text-primary-foreground">{t("nav.dashboard")}</Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">{t("nav.logout")}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("logout.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("logout.desc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("logout.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="bg-primary text-white hover:bg-primary/90">
                          {t("logout.confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">{t("nav.login")}</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start bg-secondary text-secondary-foreground">{t("nav.register")}</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
