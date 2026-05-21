import { createContext, useContext, useState, ReactNode } from "react";
import { translate } from "@/lib/translations";

export type Lang = "en" | "bm";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("kynaz_lang") as Lang) ?? "en";
  });

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === "en" ? "bm" : "en";
      localStorage.setItem("kynaz_lang", next);
      return next;
    });
  };

  const t = (key: string): string => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
