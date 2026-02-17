import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";

export function DocsCommunicationPage() {
  return (
    <>
      <DocsHeader title="Kommunikation" />
      <div className="p-6">
        <DocsProse>
          <h2>AI-stöd för kundkommunikation</h2>
          <p>
            Kommunikationsmodulen hjälper rådgivare att formulera regelrätta
            och policyenliga svar till klienter. Verktyget tar hänsyn till
            klientens portfölj, riskprofil och gällande regelverk.
          </p>
        </DocsProse>

        <div className="max-w-3xl my-6">
          <Badge variant="secondary" className="text-sm">
            Kommande funktion
          </Badge>
        </div>

        <DocsProse>
          <h3>Planerade funktioner</h3>
          <ul>
            <li>
              <strong>Utkast till svar</strong> — AI genererar förslag på
              kundkommunikationer baserat på kontext
            </li>
            <li>
              <strong>Policymedvetenhet</strong> — Utkast kontrolleras
              automatiskt mot interna policyer och regelverk
            </li>
            <li>
              <strong>Kontextuell information</strong> — Relevanta data om
              klientens portfölj, exponering och riskprofil inkluderas
            </li>
            <li>
              <strong>Marknadsdata</strong> — Aktuell marknadsdata kan
              refereras i kommunikationen
            </li>
          </ul>

          <h3>Användningsområden</h3>
          <p>
            Kommunikationsverktyget är tänkt att användas för:
          </p>
          <ul>
            <li>Svar på klientfrågor om portföljutveckling</li>
            <li>Förklaringar av rebalansering och allokationsförändringar</li>
            <li>Proaktiv kommunikation vid marknadsvolatilitet</li>
            <li>Årliga sammanfattningar och portföljöversikter</li>
          </ul>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title="Under utveckling">
            <p>
              Denna funktion är under aktiv utveckling. Kontakta oss för mer
              information om tillgänglighet och funktionalitet.
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
