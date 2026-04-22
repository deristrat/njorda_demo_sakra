import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Hantera regler",
    heading: "Hantera regler",
    intro:
      "Regelhanteringen ger administratörer full kontroll över vilka regler som används vid granskning av rådgivningsdokumentation.",
    overviewHeading: "Regelöversikt",
    overviewIntro: "Regellistan visar alla definierade regler med följande information:",
    itemIdStrong: "Regel-ID",
    itemId: " — Unik identifierare (t.ex. META_001, KYC_002)",
    itemNameStrong: "Namn",
    itemName: " — Beskrivande namn på svenska",
    itemCategoryStrong: "Kategori",
    itemCategory: " — Regelkategori (Metadata, KYC, etc.)",
    itemTierStrong: "Tier",
    itemTier: " — 1 (standard) eller 2 (AI-baserad)",
    itemMaxDeductStrong: "Max avdrag",
    itemMaxDeduct: " — Maximalt poängavdrag vid underkänd regel",
    itemSeverityStrong: "Allvarlighetsgrad",
    itemSeverity: " — Fel (error) eller varning (warning)",
    itemStatusStrong: "Status",
    itemStatus: " — Aktiv eller inaktiv",
    filteringHeading: "Filtrering och gruppering",
    filteringBody:
      "Du kan filtrera regler efter kategori, tier eller status. Listan kan också grupperas efter kategori för bättre översikt.",
    toggleHeading: "Aktivera och inaktivera regler",
    toggleBody:
      "Varje regel kan aktiveras eller inaktiveras individuellt. Inaktiverade regler exkluderas helt från poängberäkningen — de genererar inga avdrag och syns inte i dokumentgranskningar.",
    warningTitle: "Observera",
    warningBody:
      "Att inaktivera regler kan sänka granskningen av regelefterlevnaden. Se till att organisationens regelkrav fortfarande uppfylls.",
    hierarchyHeading: "Regelhierarki",
    hierarchyBody1:
      "Regler med förälder-barn-relationer visas med indrag i listan. Om du inaktiverar en överordnad regel inaktiveras även alla underliggande regler automatiskt.",
    hierarchyBody2: "Följande regelhierarkier finns:",
    kycHierarchyTitle: "KYC-hierarki",
    kycParent: "Lämplighetsbedömning saknas (15p)",
    kycChild1Name: "Ekonomisk situation",
    kycChild2Name: "Riskprofil",
    kycChild3Name: "Placeringshorisont",
    kycChild4Name: "Erfarenhetsnivå",
    kycChild5Name: "Förlusttolerans",
    kycChild6Name: "Placeringsmål",
    recHierarchyTitle: "Rekommendationshierarki",
    recParent: "Inga rekommendationer (12p)",
    recChild1Name: "Motivering saknas",
    recChild2Name: "Riskmatchning",
    severityHeading: "Allvarlighetsgrad",
    severityIntro:
      "Varje regel har en allvarlighetsgrad som påverkar hur resultaten presenteras:",
    severityErrorStrong: "Fel (error)",
    severityError:
      " — Indikerar en brist som bör åtgärdas. Visas med röd markering.",
    severityWarningStrong: "Varning (warning)",
    severityWarning:
      " — Indikerar en potentiell brist som bör granskas. Visas med gul markering.",
    severityOutro:
      "Allvarlighetsgraden påverkar inte poängberäkningen — den styr enbart den visuella presentationen.",
    calloutTitle: "Poängpåverkan",
    calloutTextBefore: "Mer information om hur poängen beräknas finns i ",
    calloutLink: "Poängsystem",
    calloutTextAfter: ".",
  },
  en: {
    headerTitle: "Manage rules",
    heading: "Manage rules",
    intro:
      "Rule management gives administrators full control over which rules are used when reviewing advisory documentation.",
    overviewHeading: "Rule overview",
    overviewIntro: "The rule list shows all defined rules with the following information:",
    itemIdStrong: "Rule ID",
    itemId: " — Unique identifier (e.g. META_001, KYC_002)",
    itemNameStrong: "Name",
    itemName: " — Descriptive name in Swedish",
    itemCategoryStrong: "Category",
    itemCategory: " — Rule category (Metadata, KYC, etc.)",
    itemTierStrong: "Tier",
    itemTier: " — 1 (standard) or 2 (AI-based)",
    itemMaxDeductStrong: "Max deduction",
    itemMaxDeduct: " — Maximum point deduction when the rule fails",
    itemSeverityStrong: "Severity",
    itemSeverity: " — Error or warning",
    itemStatusStrong: "Status",
    itemStatus: " — Active or inactive",
    filteringHeading: "Filtering and grouping",
    filteringBody:
      "You can filter rules by category, tier, or status. The list can also be grouped by category for a better overview.",
    toggleHeading: "Enabling and disabling rules",
    toggleBody:
      "Each rule can be enabled or disabled individually. Disabled rules are completely excluded from scoring — they generate no deductions and do not appear in document reviews.",
    warningTitle: "Note",
    warningBody:
      "Disabling rules can reduce the thoroughness of the compliance review. Make sure your organization's compliance requirements are still met.",
    hierarchyHeading: "Rule hierarchy",
    hierarchyBody1:
      "Rules with parent–child relationships are shown with indentation in the list. If you disable a parent rule, all underlying rules are also disabled automatically.",
    hierarchyBody2: "The following rule hierarchies exist:",
    kycHierarchyTitle: "KYC hierarchy",
    kycParent: "Suitability assessment missing (15p)",
    kycChild1Name: "Financial situation",
    kycChild2Name: "Risk profile",
    kycChild3Name: "Investment horizon",
    kycChild4Name: "Experience level",
    kycChild5Name: "Loss tolerance",
    kycChild6Name: "Investment objectives",
    recHierarchyTitle: "Recommendation hierarchy",
    recParent: "No recommendations (12p)",
    recChild1Name: "Justification missing",
    recChild2Name: "Risk matching",
    severityHeading: "Severity",
    severityIntro:
      "Each rule has a severity level that affects how results are presented:",
    severityErrorStrong: "Error",
    severityError:
      " — Indicates an issue that should be addressed. Shown with a red marker.",
    severityWarningStrong: "Warning",
    severityWarning:
      " — Indicates a potential issue that should be reviewed. Shown with a yellow marker.",
    severityOutro:
      "Severity does not affect scoring — it only controls the visual presentation.",
    calloutTitle: "Score impact",
    calloutTextBefore: "More information about how the score is calculated is available in ",
    calloutLink: "Scoring system",
    calloutTextAfter: ".",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsRulesPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  const kycChildren: [string, string, string][] = [
    ["KYC_001", t.kycChild1Name, "10p"],
    ["KYC_002", t.kycChild2Name, "10p"],
    ["KYC_003", t.kycChild3Name, "4p"],
    ["KYC_004", t.kycChild4Name, "8p"],
    ["KYC_005", t.kycChild5Name, "8p"],
    ["KYC_006", t.kycChild6Name, "4p"],
  ];

  const recChildren: [string, string, string][] = [
    ["REC_002", t.recChild1Name, "4p"],
    ["REC_003", t.recChild2Name, "12p"],
  ];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>

          <h3>{t.overviewHeading}</h3>
          <p>{t.overviewIntro}</p>
          <ul>
            <li>
              <strong>{t.itemIdStrong}</strong>
              {t.itemId}
            </li>
            <li>
              <strong>{t.itemNameStrong}</strong>
              {t.itemName}
            </li>
            <li>
              <strong>{t.itemCategoryStrong}</strong>
              {t.itemCategory}
            </li>
            <li>
              <strong>{t.itemTierStrong}</strong>
              {t.itemTier}
            </li>
            <li>
              <strong>{t.itemMaxDeductStrong}</strong>
              {t.itemMaxDeduct}
            </li>
            <li>
              <strong>{t.itemSeverityStrong}</strong>
              {t.itemSeverity}
            </li>
            <li>
              <strong>{t.itemStatusStrong}</strong>
              {t.itemStatus}
            </li>
          </ul>

          <h3>{t.filteringHeading}</h3>
          <p>{t.filteringBody}</p>

          <h3>{t.toggleHeading}</h3>
          <p>{t.toggleBody}</p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="warning" title={t.warningTitle}>
            <p>{t.warningBody}</p>
          </DocsCallout>
        </div>

        <DocsProse>
          <h3>{t.hierarchyHeading}</h3>
          <p>{t.hierarchyBody1}</p>
          <p>{t.hierarchyBody2}</p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-base font-medium mb-2">{t.kycHierarchyTitle}</p>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-sm">KYC_000</Badge>
              <span className="text-sm text-foreground">{t.kycParent}</span>
            </div>
            <div className="ml-4 border-l-2 border-muted pl-3 space-y-1">
              {kycChildren.map(([id, name, deduction]) => (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span className="font-brand text-muted-foreground w-16">
                    {id}
                  </span>
                  <span className="text-foreground">{name}</span>
                  <span className="ml-auto text-muted-foreground">
                    {deduction}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-base font-medium mb-2">
              {t.recHierarchyTitle}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-sm">REC_001</Badge>
              <span className="text-sm text-foreground">{t.recParent}</span>
            </div>
            <div className="ml-4 border-l-2 border-muted pl-3 space-y-1">
              {recChildren.map(([id, name, deduction]) => (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span className="font-brand text-muted-foreground w-16">
                    {id}
                  </span>
                  <span className="text-foreground">{name}</span>
                  <span className="ml-auto text-muted-foreground">
                    {deduction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DocsProse>
          <h3>{t.severityHeading}</h3>
          <p>{t.severityIntro}</p>
          <ul>
            <li>
              <strong>{t.severityErrorStrong}</strong>
              {t.severityError}
            </li>
            <li>
              <strong>{t.severityWarningStrong}</strong>
              {t.severityWarning}
            </li>
          </ul>
          <p>{t.severityOutro}</p>
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
