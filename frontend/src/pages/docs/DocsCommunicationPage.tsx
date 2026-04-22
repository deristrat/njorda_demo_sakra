import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Kommunikation",
    heading: "AI-stöd för kundkommunikation",
    intro:
      "Kommunikationsmodulen hjälper rådgivare att formulera regelrätta och policyenliga svar till klienter. Verktyget tar hänsyn till klientens portfölj, riskprofil och gällande regelverk.",
    comingSoon: "Kommande funktion",
    plannedHeading: "Planerade funktioner",
    plannedItem1Strong: "Utkast till svar",
    plannedItem1:
      " — AI genererar förslag på kundkommunikationer baserat på kontext",
    plannedItem2Strong: "Policymedvetenhet",
    plannedItem2:
      " — Utkast kontrolleras automatiskt mot interna policyer och regelverk",
    plannedItem3Strong: "Kontextuell information",
    plannedItem3:
      " — Relevanta data om klientens portfölj, exponering och riskprofil inkluderas",
    plannedItem4Strong: "Marknadsdata",
    plannedItem4: " — Aktuell marknadsdata kan refereras i kommunikationen",
    useCasesHeading: "Användningsområden",
    useCasesIntro: "Kommunikationsverktyget är tänkt att användas för:",
    useCase1: "Svar på klientfrågor om portföljutveckling",
    useCase2: "Förklaringar av rebalansering och allokationsförändringar",
    useCase3: "Proaktiv kommunikation vid marknadsvolatilitet",
    useCase4: "Årliga sammanfattningar och portföljöversikter",
    calloutTitle: "Under utveckling",
    calloutBody:
      "Denna funktion är under aktiv utveckling. Kontakta oss för mer information om tillgänglighet och funktionalitet.",
  },
  en: {
    headerTitle: "Communication",
    heading: "AI support for client communication",
    intro:
      "The communication module helps advisors draft compliant, policy-aligned responses to clients. The tool takes the client's portfolio, risk profile, and applicable regulations into account.",
    comingSoon: "Coming soon",
    plannedHeading: "Planned features",
    plannedItem1Strong: "Draft responses",
    plannedItem1:
      " — AI generates suggested client communications based on context",
    plannedItem2Strong: "Policy awareness",
    plannedItem2:
      " — Drafts are automatically checked against internal policies and regulations",
    plannedItem3Strong: "Contextual information",
    plannedItem3:
      " — Relevant data about the client's portfolio, exposure, and risk profile is included",
    plannedItem4Strong: "Market data",
    plannedItem4: " — Current market data can be referenced in the communication",
    useCasesHeading: "Use cases",
    useCasesIntro: "The communication tool is designed for:",
    useCase1: "Responses to client questions about portfolio performance",
    useCase2: "Explanations of rebalancing and allocation changes",
    useCase3: "Proactive communication during market volatility",
    useCase4: "Annual summaries and portfolio overviews",
    calloutTitle: "In development",
    calloutBody:
      "This feature is under active development. Contact us for more information about availability and functionality.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsCommunicationPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>
        </DocsProse>

        <div className="max-w-3xl my-6">
          <Badge variant="secondary" className="text-sm">
            {t.comingSoon}
          </Badge>
        </div>

        <DocsProse>
          <h3>{t.plannedHeading}</h3>
          <ul>
            <li>
              <strong>{t.plannedItem1Strong}</strong>
              {t.plannedItem1}
            </li>
            <li>
              <strong>{t.plannedItem2Strong}</strong>
              {t.plannedItem2}
            </li>
            <li>
              <strong>{t.plannedItem3Strong}</strong>
              {t.plannedItem3}
            </li>
            <li>
              <strong>{t.plannedItem4Strong}</strong>
              {t.plannedItem4}
            </li>
          </ul>

          <h3>{t.useCasesHeading}</h3>
          <p>{t.useCasesIntro}</p>
          <ul>
            <li>{t.useCase1}</li>
            <li>{t.useCase2}</li>
            <li>{t.useCase3}</li>
            <li>{t.useCase4}</li>
          </ul>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title={t.calloutTitle}>
            <p>{t.calloutBody}</p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
