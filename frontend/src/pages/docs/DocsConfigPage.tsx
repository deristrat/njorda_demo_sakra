import { useNavigate } from "react-router";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { Badge } from "@/components/ui/badge";

export function DocsConfigPage() {
  const navigate = useNavigate();

  return (
    <>
      <DocsHeader title="Konfiguration" />
      <div className="p-6">
        <DocsProse>
          <h2>Systemkonfiguration</h2>
          <p>
            Administratörer kan anpassa systemets beteende via
            inställningssidan. Denna sida förklarar de konfigurerbara
            parametrarna.
          </p>

          <h3>Tröskelvärden för trafikljus</h3>
          <p>
            De två tröskelvärdena som styr trafikljusfärgerna kan justeras efter
            organisationens behov:
          </p>
        </DocsProse>

        <div className="max-w-3xl my-4">
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-3 text-center text-sm">
              <div className="p-3 bg-red-50 border-r">
                <p className="font-medium text-red-800">Röd</p>
                <p className="text-xs text-red-600 mt-0.5">
                  &lt; nedre tröskelvärde
                </p>
              </div>
              <div className="p-3 bg-yellow-50 border-r">
                <p className="font-medium text-yellow-800">Gul</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  mellan tröskelvärdena
                </p>
              </div>
              <div className="p-3 bg-green-50">
                <p className="font-medium text-green-800">Grön</p>
                <p className="text-xs text-green-600 mt-0.5">
                  ≥ övre tröskelvärde
                </p>
              </div>
            </div>
            <div className="p-3 border-t bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                Standardvärden: Röd &lt; <strong>50</strong> | Gul 50–
                <strong>84</strong> | Grön ≥ <strong>85</strong>
              </p>
            </div>
          </div>
        </div>

        <DocsProse>
          <p>
            Att sänka det övre tröskelvärdet gör det lättare för dokument att
            klassificeras som gröna. Att höja det nedre tröskelvärdet gör det
            svårare att hamna i den röda zonen.
          </p>

          <h3>Regelhantering</h3>
          <p>
            Från inställningarna kan administratörer navigera till
            regelhanteringen för att:
          </p>
          <ul>
            <li>Aktivera eller inaktivera enskilda regler</li>
            <li>Se regelkategorier och hierarkier</li>
            <li>Granska avdragsvärden och allvarlighetsgrad</li>
          </ul>
          <p>
            Se{" "}
            <a
              className="text-primary underline underline-offset-2 cursor-pointer"
              onClick={() => navigate("/docs/regler")}
            >
              Hantera regler
            </a>{" "}
            för detaljerad information.
          </p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="warning" title="Observera">
            <p>
              Ändringar av tröskelvärden påverkar klassificeringen av alla
              dokument retroaktivt. Befintliga poäng ändras inte, men
              trafikljusfärgen kan ändras.
            </p>
          </DocsCallout>

          <DocsProse>
            <h3>Standardinställningar</h3>
            <p>Följande regler är inaktiverade som standard:</p>
          </DocsProse>

          <div className="space-y-2 my-4">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="text-xs">
                Inaktiv
              </Badge>
              <span className="text-muted-foreground">
                ESG_001 — Hållbarhetspreferenser
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="text-xs">
                Inaktiv
              </Badge>
              <span className="text-muted-foreground">
                COST_001 — Ersättningsinformation
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="text-xs">
                Inaktiv
              </Badge>
              <span className="text-muted-foreground">
                COST_002 — Belopp i SEK
              </span>
            </div>
          </div>

          <DocsProse>
            <p>
              Dessa kan aktiveras i regelhanteringen om organisationen vill
              inkludera dem i poängberäkningen.
            </p>
          </DocsProse>
        </div>
      </div>
    </>
  );
}
