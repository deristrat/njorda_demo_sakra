import { useLanguage, type Lang } from "@/lib/language";

interface NjordaLogoProps {
  collapsed?: boolean;
}

const translations = {
  sv: {
    tagline: "Rådgivnings Hub",
  },
  en: {
    tagline: "Advisory Hub",
  },
} satisfies Record<Lang, Record<string, string>>;

export function NjordaLogo({ collapsed }: NjordaLogoProps) {
  const { lang } = useLanguage();
  const t = translations[lang];

  if (collapsed) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#1B4F8A" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontSize="16"
          fontWeight="700"
          letterSpacing="0.5"
        >
          S
        </text>
      </svg>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#1B4F8A" />
          <text
            x="16"
            y="22"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, sans-serif"
            fontSize="16"
            fontWeight="700"
            letterSpacing="0.5"
          >
            S
          </text>
        </svg>
        <div className="flex flex-col -space-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {t.tagline}
          </span>
          <span className="text-lg font-bold tracking-wide text-[#1B4F8A]" style={{ fontFamily: "system-ui, sans-serif" }}>
            SÄKRA
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1.5 pl-[42px]">
        <span className="text-[9px] text-muted-foreground/60">powered by</span>
        <svg width="40" height="10" viewBox="0 0 40 10" fill="none">
          <text
            x="0"
            y="8"
            fill="currentColor"
            className="text-muted-foreground/60"
            fontFamily="system-ui, sans-serif"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.5"
          >
            Njorda
          </text>
        </svg>
      </div>
    </div>
  );
}
