import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";

export function DocsRulesPage() {
  const navigate = useNavigate();

  return (
    <>
      <DocsHeader title="Hantera regler" />
      <div className="p-6">
        <DocsProse>
          <h2>Hantera regler</h2>
          <p>
            Regelhanteringen ger administratörer full kontroll över vilka
            regler som används vid granskning av rådgivningsdokumentation.
          </p>

          <h3>Regelöversikt</h3>
          <p>
            Regellistan visar alla definierade regler med följande information:
          </p>
          <ul>
            <li>
              <strong>Regel-ID</strong> — Unik identifierare (t.ex. META_001,
              KYC_002)
            </li>
            <li>
              <strong>Namn</strong> — Beskrivande namn på svenska
            </li>
            <li>
              <strong>Kategori</strong> — Regelkategori (Metadata, KYC, etc.)
            </li>
            <li>
              <strong>Tier</strong> — 1 (standard) eller 2 (AI-baserad)
            </li>
            <li>
              <strong>Max avdrag</strong> — Maximalt poängavdrag vid
              underkänd regel
            </li>
            <li>
              <strong>Allvarlighetsgrad</strong> — Fel (error) eller varning
              (warning)
            </li>
            <li>
              <strong>Status</strong> — Aktiv eller inaktiv
            </li>
          </ul>

          <h3>Filtrering och gruppering</h3>
          <p>
            Du kan filtrera regler efter kategori, tier eller status. Listan
            kan också grupperas efter kategori för bättre översikt.
          </p>

          <h3>Aktivera och inaktivera regler</h3>
          <p>
            Varje regel kan aktiveras eller inaktiveras individuellt.
            Inaktiverade regler exkluderas helt från poängberäkningen — de
            genererar inga avdrag och syns inte i dokumentgranskningar.
          </p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="warning" title="Observera">
            <p>
              Att inaktivera regler kan sänka granskningen av
              regelefterlevnaden. Se till att organisationens regelkrav
              fortfarande uppfylls.
            </p>
          </DocsCallout>
        </div>

        <DocsProse>
          <h3>Regelhierarki</h3>
          <p>
            Regler med förälder-barn-relationer visas med indrag i listan. Om
            du inaktiverar en överordnad regel inaktiveras även alla
            underliggande regler automatiskt.
          </p>
          <p>
            Följande regelhierarkier finns:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-base font-medium mb-2">KYC-hierarki</p>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-sm">KYC_000</Badge>
              <span className="text-sm text-foreground/70">
                Lämplighetsbedömning saknas (15p)
              </span>
            </div>
            <div className="ml-4 border-l-2 border-muted pl-3 space-y-1">
              {[
                ["KYC_001", "Ekonomisk situation", "10p"],
                ["KYC_002", "Riskprofil", "10p"],
                ["KYC_003", "Placeringshorisont", "4p"],
                ["KYC_004", "Erfarenhetsnivå", "8p"],
                ["KYC_005", "Förlusttolerans", "8p"],
                ["KYC_006", "Placeringsmål", "4p"],
              ].map(([id, name, deduction]) => (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span className="font-brand text-foreground/60 w-16">
                    {id}
                  </span>
                  <span className="text-foreground/70">{name}</span>
                  <span className="ml-auto text-foreground/60">
                    {deduction}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-base font-medium mb-2">
              Rekommendationshierarki
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-sm">REC_001</Badge>
              <span className="text-sm text-foreground/70">
                Inga rekommendationer (12p)
              </span>
            </div>
            <div className="ml-4 border-l-2 border-muted pl-3 space-y-1">
              {[
                ["REC_002", "Motivering saknas", "4p"],
                ["REC_003", "Riskmatchning", "12p"],
              ].map(([id, name, deduction]) => (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span className="font-brand text-foreground/60 w-16">
                    {id}
                  </span>
                  <span className="text-foreground/70">{name}</span>
                  <span className="ml-auto text-foreground/60">
                    {deduction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DocsProse>
          <h3>Allvarlighetsgrad</h3>
          <p>
            Varje regel har en allvarlighetsgrad som påverkar hur resultaten
            presenteras:
          </p>
          <ul>
            <li>
              <strong>Fel (error)</strong> — Indikerar en brist som bör
              åtgärdas. Visas med röd markering.
            </li>
            <li>
              <strong>Varning (warning)</strong> — Indikerar en potentiell
              brist som bör granskas. Visas med gul markering.
            </li>
          </ul>
          <p>
            Allvarlighetsgraden påverkar inte poängberäkningen — den styr
            enbart den visuella presentationen.
          </p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title="Poängpåverkan">
            <p>
              Mer information om hur poängen beräknas finns i{" "}
              <a
                className="text-primary underline underline-offset-2 cursor-pointer"
                onClick={() => navigate("/docs/poangsystem")}
              >
                Poängsystem
              </a>
              .
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
