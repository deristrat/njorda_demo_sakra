import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "sv" | "en";

const STORAGE_KEY = "njorda.lang";

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "sv";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "sv" || stored === "en") return stored;
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en") return "en";
  return "sv";
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore quota / privacy-mode errors */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === "sv" ? "en" : "sv")), []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
