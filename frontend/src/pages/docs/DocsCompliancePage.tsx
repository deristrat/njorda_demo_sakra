import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";

export function DocsCompliancePage() {
  const navigate = useNavigate();

  return (
    <>
      <DocsHeader title="Regelefterlevnad" />
      <div className="p-6">
        <DocsProse>
          <h2>Regelefterlevnad</h2>
          <p>
            Regelefterlevnadsgranskningen är kärnan i Njorda Advisor. Varje
            uppladdat dokument utvärderas automatiskt mot en uppsättning regler
            som speglar svenska regulatoriska krav och intern policy.
          </p>

          <h3>Trafikljussystemet</h3>
          <p>
            Varje dokument tilldelas en poäng mellan 0 och 100 som visas med en
            trafikljusfärg:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="size-4 rounded-full bg-green-500" />
            <div>
              <span className="text-sm font-medium">Grön — 85–100 poäng</span>
              <p className="text-xs text-muted-foreground">
                Dokumentet uppfyller regelkraven
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="size-4 rounded-full bg-yellow-500" />
            <div>
              <span className="text-sm font-medium">Gul — 50–84 poäng</span>
              <p className="text-xs text-muted-foreground">
                Dokumentet behöver uppmärksamhet — vissa brister identifierade
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="size-4 rounded-full bg-red-500" />
            <div>
              <span className="text-sm font-medium">Röd — 0–49 poäng</span>
              <p className="text-xs text-muted-foreground">
                Dokumentet har betydande brister som kräver åtgärd
              </p>
            </div>
          </div>
        </div>

        <DocsProse>
          <p>
            Tröskelvärdena kan konfigureras av administratörer. Se{" "}
            <a
              className="text-primary underline underline-offset-2 cursor-pointer"
              onClick={() => navigate("/docs/konfiguration")}
            >
              Konfiguration
            </a>{" "}
            för mer information.
          </p>

          <h3>Granskning per regel</h3>
          <p>
            I dokumentets detaljvy kan du se varje enskild regel som utvärderats
            och dess status:
          </p>
          <ul>
            <li>
              <strong>Godkänd</strong> — Regeln är uppfylld (0 poängs avdrag)
            </li>
            <li>
              <strong>Underkänd</strong> — Regeln uppfylldes inte (poängavdrag
              tillämpas)
            </li>
            <li>
              <strong>Överhoppad</strong> — Regeln kunde inte utvärderas
              (överordnad regel underkänd)
            </li>
          </ul>

          <h3>Regelkategorier</h3>
          <p>
            Reglerna är organiserade i kategorier som speglar olika områden av
            rådgivningsdokumentation:
          </p>
          <ul>
            <li>Metadata (rådgivarens namn, företag, datum)</li>
            <li>KYC / Lämplighetsbedömning</li>
            <li>Rekommendationer och motiveringar</li>
            <li>Pensionsflytt</li>
            <li>Hållbarhet och ESG</li>
            <li>Kostnader och ersättningar</li>
            <li>AI-baserad kvalitetsbedömning</li>
          </ul>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title="Fördjupning">
            <p>
              Läs mer om hur poängen beräknas och vilka avdrag som gäller i{" "}
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
