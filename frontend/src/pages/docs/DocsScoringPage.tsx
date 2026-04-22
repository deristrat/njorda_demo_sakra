import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Poängsystem",
    heading: "Poängsystem",
    intro:
      "Denna sida förklarar i detalj hur regelefterlevnadspoängen beräknas, vilka avdrag som gäller och hur trafikljussystemet fungerar.",
    principleHeading: "Grundprincip",
    principleTextBefore:
      "Poängsystemet är avdragsbaserat. Varje dokument startar på ",
    principleStrong: "100 poäng",
    principleTextAfter:
      " och förlorar poäng för varje regel som inte uppfylls. Formeln är:",
    formulaCode: "poäng = 100 − summa(avdrag för underkända regler)",
    formulaNote: "Lägsta möjliga poäng är 0. Poängen kan aldrig bli negativ.",
    trafficLightHeading: "Trafikljussystemet",
    trafficLightIntro:
      "Poängen översätts till en trafikljusfärg som ger en snabb visuell indikation av dokumentets regelefterlevnad:",
    greenLabel: "Grön",
    greenBadge: "≥ 85 poäng",
    greenDesc:
      "Dokumentet uppfyller regelkraven. Inga eller minimala avvikelser.",
    yellowLabel: "Gul",
    yellowBadge: "50–84 poäng",
    yellowDesc:
      "Dokumentet behöver uppmärksamhet. Vissa brister identifierade som bör åtgärdas.",
    redLabel: "Röd",
    redBadge: "< 50 poäng",
    redDesc:
      "Dokumentet har betydande brister som kräver omedelbar åtgärd.",
    thresholdCalloutTitle: "Konfigurerbara tröskelvärden",
    thresholdCalloutBefore:
      "Tröskelvärdena (85 och 50) kan justeras av administratörer i ",
    thresholdCalloutLink: "Konfiguration",
    thresholdCalloutAfter: ".",
    categoriesHeading: "Regelkategorier och avdrag",
    categoriesIntro:
      "Reglerna är organiserade i kategorier. Varje kategori innehåller en eller flera regler med specifika poängavdrag:",
    tableCategory: "Kategori",
    tableRules: "Regler",
    tableDeductions: "Avdrag",
    tableExamples: "Exempel",
    catMetadata: "Metadata",
    catMetadataExamples: "Rådgivarens namn, företag, datum, klientnamn",
    catKyc: "KYC / Lämplighetsbedömning",
    catKycExamples:
      "Riskprofil, ekonomisk situation, erfarenhet, placeringshorisont",
    catRecs: "Rekommendationer",
    catRecsExamples:
      "Investeringsrekommendationer, motiveringar, riskmatchning",
    catTransfer: "Pensionsflytt",
    catTransferExamples: "Nuvarande/ny leverantör, flyttbelopp",
    catEsg: "Hållbarhet ESG",
    catEsgExamples: "Hållbarhetspreferenser",
    catCost: "Kostnader",
    catCostExamples: "Ersättningsinformation, belopp i SEK",
    catQuality: "Kvalitetsbedömning",
    catQualityExamples: "AI-baserad utvärdering av kvalitet och sammanhang",
    hierarchyHeading: "Regelhierarki",
    hierarchyIntro:
      "Vissa regler har en förälder-barn-relation. Om en överordnad regel underkänns hoppar systemet automatiskt över alla underliggande regler. Detta förhindrar dubbelbestraffning.",
    hierarchyParentName: "KYC_000 — Lämplighetsbedömning saknas",
    hierarchyParentBadge: "Förälder",
    hierarchyChild1: "KYC_001 — Ekonomisk situation",
    hierarchyChild2: "KYC_002 — Riskprofil",
    hierarchyChild3: "KYC_003 — Placeringshorisont",
    hierarchyChild4: "KYC_004 — Erfarenhetsnivå",
    hierarchyChild5: "KYC_005 — Förlusttolerans",
    hierarchyChild6: "KYC_006 — Placeringsmål",
    hierarchyNote:
      'Om KYC_000 underkänns (ingen lämplighetsbedömning funnen) markeras alla sex barnregler som "överhoppade" utan ytterligare avdrag.',
    tiersHeading: "Tier 1 vs Tier 2 regler",
    tiersIntro: "Systemet använder två typer av regelutvärdering:",
    tier1Label: "Standard",
    tier1Desc1:
      "Deterministiska kontroller som verifierar att specifika fält finns och är ifyllda. Snabba och förutsägbara.",
    tier1Desc2:
      "Exempel: kontrollerar att rådgivarens namn, riskprofil eller rekommendationer finns i dokumentet.",
    tier2Label: "AI-baserad",
    tier2Desc1:
      "LLM-baserad utvärdering som analyserar kvalitet och sammanhang, inte bara förekomst. Mer nyanserad bedömning.",
    tier2Desc2:
      "Exempel: bedömer om lämplighetsbedömningen är specifik för klienten eller generiskt formulerad.",
    statusHeading: "Resultatstatus per regel",
    statusIntro: "Varje regel kan ha ett av tre utfall:",
    statusPassed: "Godkänd",
    statusPassedLine: "0 poängs avdrag",
    statusPassedDesc: "Regeln är uppfylld",
    statusFailed: "Underkänd",
    statusFailedLine: "Poängavdrag tillämpas",
    statusFailedDesc:
      "Regeln uppfylldes inte — avdrag baserat på regelns max_deduction",
    statusSkipped: "Överhoppad",
    statusSkippedLine: "0 poängs avdrag",
    statusSkippedDesc:
      "Överordnad regel underkänd — denna regel utvärderas inte",
    exampleHeading: "Exempelberäkning",
    exampleIntro:
      "Här är ett konkret exempel på hur poängen beräknas för ett dokument med två brister:",
    exampleScenarioLabel: "Scenario",
    exampleScenarioDesc:
      "Ett rådgivningsdokument saknar rådgivarens namn och klientens riskprofil.",
    exampleStart: "Startpoäng",
    exampleDeduction1: "META_001 — Rådgivarens namn saknas",
    exampleDeduction2: "KYC_002 — Riskprofil saknas",
    exampleTotal: "Slutpoäng",
    exampleSummaryBefore: "78 poäng = ",
    exampleSummaryStrong: "Gul",
    exampleSummaryAfter: " — dokumentet behöver uppmärksamhet",
    tipTitle: "Tips",
    tipBody:
      "Granska dokumentets regelefterlevnadspanel för att se exakt vilka regler som underkänts och vad som behöver åtgärdas.",
  },
  en: {
    headerTitle: "Scoring system",
    heading: "Scoring system",
    intro:
      "This page explains in detail how the compliance score is calculated, which deductions apply, and how the traffic-light system works.",
    principleHeading: "Core principle",
    principleTextBefore:
      "The scoring system is deduction-based. Each document starts at ",
    principleStrong: "100 points",
    principleTextAfter:
      " and loses points for every rule that is not met. The formula is:",
    formulaCode: "score = 100 − sum(deductions for failed rules)",
    formulaNote:
      "The lowest possible score is 0. Scores can never go negative.",
    trafficLightHeading: "The traffic-light system",
    trafficLightIntro:
      "The score is translated into a traffic-light color that gives a quick visual indication of the document's compliance:",
    greenLabel: "Green",
    greenBadge: "≥ 85 points",
    greenDesc:
      "The document meets compliance requirements. No or minimal issues.",
    yellowLabel: "Yellow",
    yellowBadge: "50–84 points",
    yellowDesc:
      "The document needs attention. Some issues identified that should be addressed.",
    redLabel: "Red",
    redBadge: "< 50 points",
    redDesc:
      "The document has significant issues that require immediate action.",
    thresholdCalloutTitle: "Configurable thresholds",
    thresholdCalloutBefore:
      "The thresholds (85 and 50) can be adjusted by administrators in ",
    thresholdCalloutLink: "Configuration",
    thresholdCalloutAfter: ".",
    categoriesHeading: "Rule categories and deductions",
    categoriesIntro:
      "The rules are organized into categories. Each category contains one or more rules with specific point deductions:",
    tableCategory: "Category",
    tableRules: "Rules",
    tableDeductions: "Deductions",
    tableExamples: "Examples",
    catMetadata: "Metadata",
    catMetadataExamples: "Advisor's name, company, date, client name",
    catKyc: "KYC / Suitability assessment",
    catKycExamples:
      "Risk profile, financial situation, experience, investment horizon",
    catRecs: "Recommendations",
    catRecsExamples:
      "Investment recommendations, justifications, risk matching",
    catTransfer: "Pension transfer",
    catTransferExamples: "Current/new provider, transfer amount",
    catEsg: "Sustainability ESG",
    catEsgExamples: "Sustainability preferences",
    catCost: "Costs",
    catCostExamples: "Fee information, amounts in SEK",
    catQuality: "Quality assessment",
    catQualityExamples: "AI-based evaluation of quality and context",
    hierarchyHeading: "Rule hierarchy",
    hierarchyIntro:
      "Some rules have a parent–child relationship. If a parent rule fails, the system automatically skips all underlying rules. This prevents double-penalizing.",
    hierarchyParentName: "KYC_000 — Suitability assessment missing",
    hierarchyParentBadge: "Parent",
    hierarchyChild1: "KYC_001 — Financial situation",
    hierarchyChild2: "KYC_002 — Risk profile",
    hierarchyChild3: "KYC_003 — Investment horizon",
    hierarchyChild4: "KYC_004 — Experience level",
    hierarchyChild5: "KYC_005 — Loss tolerance",
    hierarchyChild6: "KYC_006 — Investment objectives",
    hierarchyNote:
      'If KYC_000 fails (no suitability assessment found), all six child rules are marked as "skipped" with no additional deduction.',
    tiersHeading: "Tier 1 vs Tier 2 rules",
    tiersIntro: "The system uses two types of rule evaluation:",
    tier1Label: "Standard",
    tier1Desc1:
      "Deterministic checks that verify specific fields exist and are filled in. Fast and predictable.",
    tier1Desc2:
      "Example: checks that the advisor's name, risk profile, or recommendations appear in the document.",
    tier2Label: "AI-based",
    tier2Desc1:
      "LLM-based evaluation that analyzes quality and context, not just presence. A more nuanced assessment.",
    tier2Desc2:
      "Example: assesses whether the suitability assessment is specific to the client or generically worded.",
    statusHeading: "Result status per rule",
    statusIntro: "Each rule can have one of three outcomes:",
    statusPassed: "Passed",
    statusPassedLine: "0-point deduction",
    statusPassedDesc: "The rule is fulfilled",
    statusFailed: "Failed",
    statusFailedLine: "Deduction applied",
    statusFailedDesc:
      "The rule was not fulfilled — deduction based on the rule's max_deduction",
    statusSkipped: "Skipped",
    statusSkippedLine: "0-point deduction",
    statusSkippedDesc:
      "Parent rule failed — this rule is not evaluated",
    exampleHeading: "Example calculation",
    exampleIntro:
      "Here is a concrete example of how the score is calculated for a document with two issues:",
    exampleScenarioLabel: "Scenario",
    exampleScenarioDesc:
      "An advisory document is missing the advisor's name and the client's risk profile.",
    exampleStart: "Starting score",
    exampleDeduction1: "META_001 — Advisor's name missing",
    exampleDeduction2: "KYC_002 — Risk profile missing",
    exampleTotal: "Final score",
    exampleSummaryBefore: "78 points = ",
    exampleSummaryStrong: "Yellow",
    exampleSummaryAfter: " — the document needs attention",
    tipTitle: "Tip",
    tipBody:
      "Review the document's compliance panel to see exactly which rules failed and what needs to be addressed.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsScoringPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  const categoryDeductions = [
    {
      category: t.catMetadata,
      rules: "META_001–004",
      deductions: "3–12p",
      examples: t.catMetadataExamples,
    },
    {
      category: t.catKyc,
      rules: "KYC_000–006",
      deductions: "4–15p",
      examples: t.catKycExamples,
    },
    {
      category: t.catRecs,
      rules: "REC_001–003",
      deductions: "4–12p",
      examples: t.catRecsExamples,
    },
    {
      category: t.catTransfer,
      rules: "TRANSFER_001–003",
      deductions: "4–10p",
      examples: t.catTransferExamples,
    },
    {
      category: t.catEsg,
      rules: "ESG_001",
      deductions: "5p",
      examples: t.catEsgExamples,
    },
    {
      category: t.catCost,
      rules: "COST_001–002",
      deductions: "4–12p",
      examples: t.catCostExamples,
    },
    {
      category: t.catQuality,
      rules: "SUIT_001–002",
      deductions: "5–10p",
      examples: t.catQualityExamples,
    },
  ];

  const childRules = [
    t.hierarchyChild1,
    t.hierarchyChild2,
    t.hierarchyChild3,
    t.hierarchyChild4,
    t.hierarchyChild5,
    t.hierarchyChild6,
  ];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>

          <h2>{t.principleHeading}</h2>
          <p>
            {t.principleTextBefore}
            <strong>{t.principleStrong}</strong>
            {t.principleTextAfter}
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 rounded-lg border bg-muted/50 p-4">
          <code className="font-brand text-base">{t.formulaCode}</code>
          <p className="text-sm text-foreground mt-2">{t.formulaNote}</p>
        </div>

        <DocsProse>
          <h2>{t.trafficLightHeading}</h2>
          <p>{t.trafficLightIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-0">
          <div className="flex items-stretch">
            <div className="w-2 bg-green-500 rounded-tl-lg" />
            <div className="flex-1 border border-l-0 rounded-tr-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-medium">{t.greenLabel}</span>
                <Badge variant="outline" className="text-sm">
                  {t.greenBadge}
                </Badge>
              </div>
              <p className="text-sm text-foreground">{t.greenDesc}</p>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="w-2 bg-yellow-500" />
            <div className="flex-1 border border-t-0 border-l-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-medium">{t.yellowLabel}</span>
                <Badge variant="outline" className="text-sm">
                  {t.yellowBadge}
                </Badge>
              </div>
              <p className="text-sm text-foreground">{t.yellowDesc}</p>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="w-2 bg-red-500 rounded-bl-lg" />
            <div className="flex-1 border border-t-0 border-l-0 rounded-br-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-medium">{t.redLabel}</span>
                <Badge variant="outline" className="text-sm">
                  {t.redBadge}
                </Badge>
              </div>
              <p className="text-sm text-foreground">{t.redDesc}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title={t.thresholdCalloutTitle}>
            <p>
              {t.thresholdCalloutBefore}
              <a
                className="text-primary underline underline-offset-2 cursor-pointer"
                onClick={() => navigate("/docs/konfiguration")}
              >
                {t.thresholdCalloutLink}
              </a>
              {t.thresholdCalloutAfter}
            </p>
          </DocsCallout>
        </div>

        <DocsProse>
          <h2>{t.categoriesHeading}</h2>
          <p>{t.categoriesIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.tableCategory}</TableHead>
                <TableHead>{t.tableRules}</TableHead>
                <TableHead>{t.tableDeductions}</TableHead>
                <TableHead>{t.tableExamples}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryDeductions.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium text-sm">
                    {row.category}
                  </TableCell>
                  <TableCell className="text-sm font-brand">
                    {row.rules}
                  </TableCell>
                  <TableCell className="text-sm">{row.deductions}</TableCell>
                  <TableCell className="text-sm">{row.examples}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DocsProse>
          <h2>{t.hierarchyHeading}</h2>
          <p>{t.hierarchyIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 rounded-lg border p-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-base font-medium">
                  {t.hierarchyParentName}
                </span>
                <Badge variant="outline" className="text-sm">
                  {t.hierarchyParentBadge}
                </Badge>
              </div>
              <div className="ml-4 mt-2 border-l-2 border-muted pl-4 space-y-1.5">
                {childRules.map((child) => (
                  <div key={child} className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-muted-foreground" />
                    <span className="text-sm text-foreground">{child}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground mt-3 pt-3 border-t">
            {t.hierarchyNote}
          </p>
        </div>

        <DocsProse>
          <h2>{t.tiersHeading}</h2>
          <p>{t.tiersIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary">Tier 1</Badge>
              <span className="text-base font-medium">{t.tier1Label}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {t.tier1Desc1}
            </p>
            <p className="text-sm text-foreground leading-relaxed mt-2">
              {t.tier1Desc2}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Tier 2</Badge>
              <span className="text-base font-medium">{t.tier2Label}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {t.tier2Desc1}
            </p>
            <p className="text-sm text-foreground leading-relaxed mt-2">
              {t.tier2Desc2}
            </p>
          </div>
        </div>

        <DocsProse>
          <h2>{t.statusHeading}</h2>
          <p>{t.statusIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Badge className="bg-green-600 w-24 justify-center">
              {t.statusPassed}
            </Badge>
            <div>
              <span className="text-base">{t.statusPassedLine}</span>
              <p className="text-sm text-foreground">{t.statusPassedDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Badge className="bg-red-600 w-24 justify-center">
              {t.statusFailed}
            </Badge>
            <div>
              <span className="text-base">{t.statusFailedLine}</span>
              <p className="text-sm text-foreground">{t.statusFailedDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Badge variant="secondary" className="w-24 justify-center">
              {t.statusSkipped}
            </Badge>
            <div>
              <span className="text-base">{t.statusSkippedLine}</span>
              <p className="text-sm text-foreground">{t.statusSkippedDesc}</p>
            </div>
          </div>
        </div>

        <DocsProse>
          <h2>{t.exampleHeading}</h2>
          <p>{t.exampleIntro}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 rounded-lg border overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <p className="text-base font-medium">{t.exampleScenarioLabel}</p>
            <p className="text-sm text-foreground mt-1">
              {t.exampleScenarioDesc}
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-base">
              <span>{t.exampleStart}</span>
              <span className="font-brand">100</span>
            </div>
            <div className="flex items-center justify-between text-base text-red-600">
              <span>{t.exampleDeduction1}</span>
              <span className="font-brand">−12</span>
            </div>
            <div className="flex items-center justify-between text-base text-red-600">
              <span>{t.exampleDeduction2}</span>
              <span className="font-brand">−10</span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between text-base font-medium">
              <span>{t.exampleTotal}</span>
              <div className="flex items-center gap-2">
                <span className="font-brand text-lg">78</span>
                <div className="size-3 rounded-full bg-yellow-500" />
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border-t border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              {t.exampleSummaryBefore}
              <strong>{t.exampleSummaryStrong}</strong>
              {t.exampleSummaryAfter}
            </p>
          </div>
        </div>

        <div className="max-w-3xl">
          <DocsCallout variant="tip" title={t.tipTitle}>
            <p>{t.tipBody}</p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
