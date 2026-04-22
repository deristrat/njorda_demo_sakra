import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Konfiguration",
    heading: "Systemkonfiguration",
    intro:
      "Administratörer kan anpassa systemets beteende via inställningssidan. Denna sida förklarar de konfigurerbara parametrarna.",
    thresholdHeading: "Tröskelvärden för trafikljus",
    thresholdIntro:
      "De två tröskelvärdena som styr trafikljusfärgerna kan justeras efter organisationens behov:",
    redLabel: "Röd",
    redRange: "< nedre tröskelvärde",
    yellowLabel: "Gul",
    yellowRange: "mellan tröskelvärdena",
    greenLabel: "Grön",
    greenRange: "≥ övre tröskelvärde",
    defaultsBefore: "Standardvärden: Röd < ",
    defaultsMiddle1: " | Gul 50–",
    defaultsMiddle2: " | Grön ≥ ",
    thresholdExplainer:
      "Att sänka det övre tröskelvärdet gör det lättare för dokument att klassificeras som gröna. Att höja det nedre tröskelvärdet gör det svårare att hamna i den röda zonen.",
    rulesHeading: "Regelhantering",
    rulesIntro:
      "Från inställningarna kan administratörer navigera till regelhanteringen för att:",
    rulesItem1: "Aktivera eller inaktivera enskilda regler",
    rulesItem2: "Se regelkategorier och hierarkier",
    rulesItem3: "Granska avdragsvärden och allvarlighetsgrad",
    rulesLinkBefore: "Se ",
    rulesLink: "Hantera regler",
    rulesLinkAfter: " för detaljerad information.",
    warningTitle: "Observera",
    warningBody:
      "Ändringar av tröskelvärden påverkar klassificeringen av alla dokument retroaktivt. Befintliga poäng ändras inte, men trafikljusfärgen kan ändras.",
    defaultsHeading: "Standardinställningar",
    defaultsIntro: "Följande regler är inaktiverade som standard:",
    inactive: "Inaktiv",
    disabledRule1: "ESG_001 — Hållbarhetspreferenser",
    disabledRule2: "COST_001 — Ersättningsinformation",
    disabledRule3: "COST_002 — Belopp i SEK",
    defaultsOutro:
      "Dessa kan aktiveras i regelhanteringen om organisationen vill inkludera dem i poängberäkningen.",
  },
  en: {
    headerTitle: "Configuration",
    heading: "System configuration",
    intro:
      "Administrators can customize system behavior from the settings page. This page explains the configurable parameters.",
    thresholdHeading: "Traffic-light thresholds",
    thresholdIntro:
      "The two thresholds that control the traffic-light colors can be adjusted to your organization's needs:",
    redLabel: "Red",
    redRange: "< lower threshold",
    yellowLabel: "Yellow",
    yellowRange: "between thresholds",
    greenLabel: "Green",
    greenRange: "≥ upper threshold",
    defaultsBefore: "Defaults: Red < ",
    defaultsMiddle1: " | Yellow 50–",
    defaultsMiddle2: " | Green ≥ ",
    thresholdExplainer:
      "Lowering the upper threshold makes it easier for documents to be classified as green. Raising the lower threshold makes it harder to land in the red zone.",
    rulesHeading: "Rule management",
    rulesIntro:
      "From settings, administrators can navigate to rule management to:",
    rulesItem1: "Enable or disable individual rules",
    rulesItem2: "View rule categories and hierarchies",
    rulesItem3: "Review deduction values and severity",
    rulesLinkBefore: "See ",
    rulesLink: "Manage rules",
    rulesLinkAfter: " for detailed information.",
    warningTitle: "Note",
    warningBody:
      "Changes to thresholds affect the classification of all documents retroactively. Existing scores do not change, but the traffic-light color may.",
    defaultsHeading: "Default settings",
    defaultsIntro: "The following rules are disabled by default:",
    inactive: "Inactive",
    disabledRule1: "ESG_001 — Sustainability preferences",
    disabledRule2: "COST_001 — Fee information",
    disabledRule3: "COST_002 — Amounts in SEK",
    defaultsOutro:
      "These can be enabled in rule management if your organization wants to include them in the scoring calculation.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsConfigPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>

          <h3>{t.thresholdHeading}</h3>
          <p>{t.thresholdIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4">
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-3 text-center">
              <div className="p-3 bg-red-50 border-r">
                <p className="font-medium text-red-800">{t.redLabel}</p>
                <p className="text-sm text-red-700 mt-0.5">{t.redRange}</p>
              </div>
              <div className="p-3 bg-yellow-50 border-r">
                <p className="font-medium text-yellow-800">{t.yellowLabel}</p>
                <p className="text-sm text-yellow-700 mt-0.5">
                  {t.yellowRange}
                </p>
              </div>
              <div className="p-3 bg-green-50">
                <p className="font-medium text-green-800">{t.greenLabel}</p>
                <p className="text-sm text-green-700 mt-0.5">{t.greenRange}</p>
              </div>
            </div>
            <div className="p-3 border-t bg-muted/30 text-center">
              <p className="text-sm text-foreground">
                {t.defaultsBefore}
                <strong>50</strong>
                {t.defaultsMiddle1}
                <strong>84</strong>
                {t.defaultsMiddle2}
                <strong>85</strong>
              </p>
            </div>
          </div>
        </div>

        <DocsProse>
          <p>{t.thresholdExplainer}</p>

          <h3>{t.rulesHeading}</h3>
          <p>{t.rulesIntro}</p>
          <ul>
            <li>{t.rulesItem1}</li>
            <li>{t.rulesItem2}</li>
            <li>{t.rulesItem3}</li>
          </ul>
          <p>
            {t.rulesLinkBefore}
            <a
              className="text-primary underline underline-offset-2 cursor-pointer"
              onClick={() => navigate("/docs/regler")}
            >
              {t.rulesLink}
            </a>
            {t.rulesLinkAfter}
          </p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="warning" title={t.warningTitle}>
            <p>{t.warningBody}</p>
          </DocsCallout>

          <DocsProse>
            <h3>{t.defaultsHeading}</h3>
            <p>{t.defaultsIntro}</p>
          </DocsProse>

          <div className="space-y-2 my-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {t.inactive}
              </Badge>
              <span className="text-foreground">{t.disabledRule1}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {t.inactive}
              </Badge>
              <span className="text-foreground">{t.disabledRule2}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {t.inactive}
              </Badge>
              <span className="text-foreground">{t.disabledRule3}</span>
            </div>
          </div>

          <DocsProse>
            <p>{t.defaultsOutro}</p>
          </DocsProse>
        </div>
      </div>
    </>
  );
}
