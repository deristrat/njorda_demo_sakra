import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFont } from "@/hooks/use-font";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    bodyLabel: "Brödtext",
    bodyHelp: "Typsnitt för brödtext och gränssnitt.",
    brandLabel: "Siffror & rubriker (brand)",
    brandHelp: "Typsnitt för KPI-värden, rubriker och sidomeny.",
  },
  en: {
    bodyLabel: "Body text",
    bodyHelp: "Font for body text and interface.",
    brandLabel: "Numbers & headings (brand)",
    brandHelp: "Font for KPI values, headings and sidebar.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function FontPicker() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const {
    currentFont,
    changeFont,
    fontOptions,
    currentBrandFont,
    changeBrandFont,
    brandFontOptions,
  } = useFont();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t.bodyLabel}</Label>
        <Select value={currentFont} onValueChange={changeFont}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t.bodyHelp}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t.brandLabel}</Label>
        <Select value={currentBrandFont} onValueChange={changeBrandFont}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {brandFontOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t.brandHelp}
        </p>
      </div>
    </div>
  );
}
