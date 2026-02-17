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

const categoryDeductions = [
  {
    category: "Metadata",
    rules: "META_001–004",
    deductions: "3–12p",
    examples: "Rådgivarens namn, företag, datum, klientnamn",
  },
  {
    category: "KYC / Lämplighetsbedömning",
    rules: "KYC_000–006",
    deductions: "4–15p",
    examples: "Riskprofil, ekonomisk situation, erfarenhet, placeringshorisont",
  },
  {
    category: "Rekommendationer",
    rules: "REC_001–003",
    deductions: "4–12p",
    examples: "Investeringsrekommendationer, motiveringar, riskmatchning",
  },
  {
    category: "Pensionsflytt",
    rules: "TRANSFER_001–003",
    deductions: "4–10p",
    examples: "Nuvarande/ny leverantör, flyttbelopp",
  },
  {
    category: "Hållbarhet ESG",
    rules: "ESG_001",
    deductions: "5p",
    examples: "Hållbarhetspreferenser",
  },
  {
    category: "Kostnader",
    rules: "COST_001–002",
    deductions: "4–12p",
    examples: "Ersättningsinformation, belopp i SEK",
  },
  {
    category: "Kvalitetsbedömning",
    rules: "SUIT_001–002",
    deductions: "5–10p",
    examples: "AI-baserad utvärdering av kvalitet och sammanhang",
  },
];

export function DocsScoringPage() {
  const navigate = useNavigate();

  return (
    <>
      <DocsHeader title="Poängsystem" />
      <div className="p-6">
        <DocsProse>
          <h2>Poängsystem</h2>
          <p>
            Denna sida förklarar i detalj hur regelefterlevnadspoängen beräknas,
            vilka avdrag som gäller och hur trafikljussystemet fungerar.
          </p>

          <h2>Grundprincip</h2>
          <p>
            Poängsystemet är avdragsbaserat. Varje dokument startar på{" "}
            <strong>100 poäng</strong> och förlorar poäng för varje regel som
            inte uppfylls. Formeln är:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 rounded-lg border bg-muted/50 p-4">
          <code className="font-brand text-sm">
            poäng = 100 − summa(avdrag för underkända regler)
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Lägsta möjliga poäng är 0. Poängen kan aldrig bli negativ.
          </p>
        </div>

        <DocsProse>
          <h2>Trafikljussystemet</h2>
          <p>
            Poängen översätts till en trafikljusfärg som ger en snabb visuell
            indikation av dokumentets regelefterlevnad:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-0">
          <div className="flex items-stretch">
            <div className="w-2 bg-green-500 rounded-tl-lg" />
            <div className="flex-1 border border-l-0 rounded-tr-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Grön</span>
                <Badge variant="outline" className="text-xs">
                  ≥ 85 poäng
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Dokumentet uppfyller regelkraven. Inga eller minimala avvikelser.
              </p>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="w-2 bg-yellow-500" />
            <div className="flex-1 border border-t-0 border-l-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Gul</span>
                <Badge variant="outline" className="text-xs">
                  50–84 poäng
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Dokumentet behöver uppmärksamhet. Vissa brister identifierade som
                bör åtgärdas.
              </p>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="w-2 bg-red-500 rounded-bl-lg" />
            <div className="flex-1 border border-t-0 border-l-0 rounded-br-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Röd</span>
                <Badge variant="outline" className="text-xs">
                  &lt; 50 poäng
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Dokumentet har betydande brister som kräver omedelbar åtgärd.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title="Konfigurerbara tröskelvärden">
            <p>
              Tröskelvärdena (85 och 50) kan justeras av administratörer i{" "}
              <a
                className="text-primary underline underline-offset-2 cursor-pointer"
                onClick={() => navigate("/docs/konfiguration")}
              >
                Konfiguration
              </a>
              .
            </p>
          </DocsCallout>
        </div>

        <DocsProse>
          <h2>Regelkategorier och avdrag</h2>
          <p>
            Reglerna är organiserade i kategorier. Varje kategori innehåller en
            eller flera regler med specifika poängavdrag:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Regler</TableHead>
                <TableHead>Avdrag</TableHead>
                <TableHead>Exempel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryDeductions.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium text-xs">
                    {row.category}
                  </TableCell>
                  <TableCell className="text-xs font-brand">
                    {row.rules}
                  </TableCell>
                  <TableCell className="text-xs">{row.deductions}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.examples}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DocsProse>
          <h2>Regelhierarki</h2>
          <p>
            Vissa regler har en förälder-barn-relation. Om en överordnad regel
            underkänns hoppar systemet automatiskt över alla underliggande
            regler. Detta förhindrar dubbelbestraffning.
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 rounded-lg border p-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm font-medium">
                  KYC_000 — Lämplighetsbedömning saknas
                </span>
                <Badge variant="outline" className="text-xs">
                  Förälder
                </Badge>
              </div>
              <div className="ml-4 mt-2 border-l-2 border-muted pl-4 space-y-1.5">
                {[
                  "KYC_001 — Ekonomisk situation",
                  "KYC_002 — Riskprofil",
                  "KYC_003 — Placeringshorisont",
                  "KYC_004 — Erfarenhetsnivå",
                  "KYC_005 — Förlusttolerans",
                  "KYC_006 — Placeringsmål",
                ].map((child) => (
                  <div key={child} className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {child}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Om KYC_000 underkänns (ingen lämplighetsbedömning funnen) markeras
            alla sex barnregler som "överhoppade" utan ytterligare avdrag.
          </p>
        </div>

        <DocsProse>
          <h2>Tier 1 vs Tier 2 regler</h2>
          <p>
            Systemet använder två typer av regelutvärdering:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary">Tier 1</Badge>
              <span className="text-sm font-medium">Standard</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Deterministiska kontroller som verifierar att specifika fält finns
              och är ifyllda. Snabba och förutsägbara.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Exempel: kontrollerar att rådgivarens namn, riskprofil eller
              rekommendationer finns i dokumentet.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Tier 2</Badge>
              <span className="text-sm font-medium">AI-baserad</span>
            </div>
            <p className="text-xs text-muted-foreground">
              LLM-baserad utvärdering som analyserar kvalitet och sammanhang,
              inte bara förekomst. Mer nyanserad bedömning.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Exempel: bedömer om lämplighetsbedömningen är specifik för
              klienten eller generiskt formulerad.
            </p>
          </div>
        </div>

        <DocsProse>
          <h2>Resultatstatus per regel</h2>
          <p>
            Varje regel kan ha ett av tre utfall:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Badge className="bg-green-600 w-24 justify-center">Godkänd</Badge>
            <div>
              <span className="text-sm">0 poängs avdrag</span>
              <p className="text-xs text-muted-foreground">
                Regeln är uppfylld
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Badge className="bg-red-600 w-24 justify-center">Underkänd</Badge>
            <div>
              <span className="text-sm">Poängavdrag tillämpas</span>
              <p className="text-xs text-muted-foreground">
                Regeln uppfylldes inte — avdrag baserat på regelns max_deduction
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Badge variant="secondary" className="w-24 justify-center">
              Överhoppad
            </Badge>
            <div>
              <span className="text-sm">0 poängs avdrag</span>
              <p className="text-xs text-muted-foreground">
                Överordnad regel underkänd — denna regel utvärderas inte
              </p>
            </div>
          </div>
        </div>

        <DocsProse>
          <h2>Exempelberäkning</h2>
          <p>
            Här är ett konkret exempel på hur poängen beräknas för ett dokument
            med två brister:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 rounded-lg border overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <p className="text-sm font-medium">Scenario</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ett rådgivningsdokument saknar rådgivarens namn och klientens
              riskprofil.
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Startpoäng</span>
              <span className="font-brand">100</span>
            </div>
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>META_001 — Rådgivarens namn saknas</span>
              <span className="font-brand">−12</span>
            </div>
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>KYC_002 — Riskprofil saknas</span>
              <span className="font-brand">−10</span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between text-sm font-medium">
              <span>Slutpoäng</span>
              <div className="flex items-center gap-2">
                <span className="font-brand text-base">78</span>
                <div className="size-3 rounded-full bg-yellow-500" />
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border-t border-yellow-200 p-3">
            <p className="text-xs text-yellow-800">
              78 poäng = <strong>Gul</strong> — dokumentet behöver
              uppmärksamhet
            </p>
          </div>
        </div>

        <div className="max-w-3xl">
          <DocsCallout variant="tip" title="Tips">
            <p>
              Granska dokumentets regelefterlevnadspanel för att se exakt vilka
              regler som underkänts och vad som behöver åtgärdas.
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
