import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Regelefterlevnad",
    heading: "Regelefterlevnad",
    intro:
      "Regelefterlevnadsgranskningen är kärnan i Säkra. Varje uppladdat dokument utvärderas automatiskt mot en uppsättning regler som speglar svenska regulatoriska krav och intern policy.",
    trafficLightHeading: "Trafikljussystemet",
    trafficLightIntro:
      "Varje dokument tilldelas en poäng mellan 0 och 100 som visas med en trafikljusfärg:",
    greenLabel: "Grön — 85–100 poäng",
    greenDescription: "Dokumentet uppfyller regelkraven",
    yellowLabel: "Gul — 50–84 poäng",
    yellowDescription:
      "Dokumentet behöver uppmärksamhet — vissa brister identifierade",
    redLabel: "Röd — 0–49 poäng",
    redDescription:
      "Dokumentet har betydande brister som kräver åtgärd",
    thresholdTextBefore:
      "Tröskelvärdena kan konfigureras av administratörer. Se ",
    thresholdLink: "Konfiguration",
    thresholdTextAfter: " för mer information.",
    perRuleHeading: "Granskning per regel",
    perRuleIntro:
      "I dokumentets detaljvy kan du se varje enskild regel som utvärderats och dess status:",
    statusPassedStrong: "Godkänd",
    statusPassed: " — Regeln är uppfylld (0 poängs avdrag)",
    statusFailedStrong: "Underkänd",
    statusFailed:
      " — Regeln uppfylldes inte (poängavdrag tillämpas)",
    statusSkippedStrong: "Överhoppad",
    statusSkipped:
      " — Regeln kunde inte utvärderas (överordnad regel underkänd)",
    categoriesHeading: "Regelkategorier",
    categoriesIntro:
      "Reglerna är organiserade i kategorier som speglar olika områden av rådgivningsdokumentation:",
    catMetadata: "Metadata (rådgivarens namn, företag, datum)",
    catKyc: "KYC / Lämplighetsbedömning",
    catRecs: "Rekommendationer och motiveringar",
    catTransfer: "Pensionsflytt",
    catEsg: "Hållbarhet och ESG",
    catCost: "Kostnader och ersättningar",
    catAi: "AI-baserad kvalitetsbedömning",
    calloutTitle: "Fördjupning",
    calloutTextBefore:
      "Läs mer om hur poängen beräknas och vilka avdrag som gäller i ",
    calloutLink: "Poängsystem",
    calloutTextAfter: ".",
  },
  en: {
    headerTitle: "Compliance",
    heading: "Compliance",
    intro:
      "Compliance review is at the heart of Säkra. Each uploaded document is automatically evaluated against a set of rules that reflect Swedish regulatory requirements and internal policy.",
    trafficLightHeading: "The traffic-light system",
    trafficLightIntro:
      "Each document is given a score between 0 and 100, shown with a traffic-light color:",
    greenLabel: "Green — 85–100 points",
    greenDescription: "The document meets compliance requirements",
    yellowLabel: "Yellow — 50–84 points",
    yellowDescription:
      "The document needs attention — some issues identified",
    redLabel: "Red — 0–49 points",
    redDescription:
      "The document has significant issues that require action",
    thresholdTextBefore:
      "Thresholds can be configured by administrators. See ",
    thresholdLink: "Configuration",
    thresholdTextAfter: " for more information.",
    perRuleHeading: "Review per rule",
    perRuleIntro:
      "In the document's detail view you can see every rule that was evaluated and its status:",
    statusPassedStrong: "Passed",
    statusPassed: " — The rule is fulfilled (0-point deduction)",
    statusFailedStrong: "Failed",
    statusFailed:
      " — The rule was not fulfilled (a point deduction is applied)",
    statusSkippedStrong: "Skipped",
    statusSkipped:
      " — The rule could not be evaluated (a parent rule failed)",
    categoriesHeading: "Rule categories",
    categoriesIntro:
      "The rules are organized into categories that reflect different areas of advisory documentation:",
    catMetadata: "Metadata (advisor's name, company, date)",
    catKyc: "KYC / Suitability assessment",
    catRecs: "Recommendations and justifications",
    catTransfer: "Pension transfer",
    catEsg: "Sustainability and ESG",
    catCost: "Costs and fees",
    catAi: "AI-based quality assessment",
    calloutTitle: "Deep dive",
    calloutTextBefore:
      "Read more about how the score is calculated and which deductions apply in ",
    calloutLink: "Scoring system",
    calloutTextAfter: ".",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsCompliancePage() {
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

          <h3>{t.trafficLightHeading}</h3>
          <p>{t.trafficLightIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="size-4 rounded-full bg-green-500" />
            <div>
              <span className="text-base font-medium">{t.greenLabel}</span>
              <p className="text-sm text-foreground">{t.greenDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="size-4 rounded-full bg-yellow-500" />
            <div>
              <span className="text-base font-medium">{t.yellowLabel}</span>
              <p className="text-sm text-foreground">{t.yellowDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="size-4 rounded-full bg-red-500" />
            <div>
              <span className="text-base font-medium">{t.redLabel}</span>
              <p className="text-sm text-foreground">{t.redDescription}</p>
            </div>
          </div>
        </div>

        <DocsProse>
          <p>
            {t.thresholdTextBefore}
            <a
              className="text-primary underline underline-offset-2 cursor-pointer"
              onClick={() => navigate("/docs/konfiguration")}
            >
              {t.thresholdLink}
            </a>
            {t.thresholdTextAfter}
          </p>

          <h3>{t.perRuleHeading}</h3>
          <p>{t.perRuleIntro}</p>
          <ul>
            <li>
              <strong>{t.statusPassedStrong}</strong>
              {t.statusPassed}
            </li>
            <li>
              <strong>{t.statusFailedStrong}</strong>
              {t.statusFailed}
            </li>
            <li>
              <strong>{t.statusSkippedStrong}</strong>
              {t.statusSkipped}
            </li>
          </ul>

          <h3>{t.categoriesHeading}</h3>
          <p>{t.categoriesIntro}</p>
          <ul>
            <li>{t.catMetadata}</li>
            <li>{t.catKyc}</li>
            <li>{t.catRecs}</li>
            <li>{t.catTransfer}</li>
            <li>{t.catEsg}</li>
            <li>{t.catCost}</li>
            <li>{t.catAi}</li>
          </ul>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title={t.calloutTitle}>
            <p>
              {t.calloutTextBefore}
              <a
                className="text-primary underline underline-offset-2 cursor-pointer"
                onClick={() => navigate("/docs/poangsystem")}
              >
                {t.calloutLink}
              </a>
              {t.calloutTextAfter}
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
