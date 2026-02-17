import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsStepList } from "@/components/docs/DocsStepList";
import { DocsCallout } from "@/components/docs/DocsCallout";

const steps = [
  {
    title: "Logga in",
    description: (
      <p>
        Navigera till inloggningssidan och ange dina användaruppgifter. Du
        kommer att skickas vidare till uppladdningsvyn efter lyckad inloggning.
      </p>
    ),
  },
  {
    title: "Ladda upp dokument",
    description: (
      <p>
        Dra och släpp PDF-filer i uppladdningsytan, eller klicka för att välja
        filer. Systemet börjar automatiskt bearbeta dokumenten och extrahera
        relevant information.
      </p>
    ),
  },
  {
    title: "Granska regelefterlevnad",
    description: (
      <p>
        När dokumenten är bearbetade kan du se deras regelefterlevnadspoäng i
        dokumentlistan. Klicka på ett dokument för att se detaljerad information
        om vilka regler som passerat och vilka som behöver åtgärdas.
      </p>
    ),
  },
  {
    title: "Konfigurera vid behov",
    description: (
      <p>
        Administratörer kan anpassa tröskelvärden för trafikljussystemet och
        aktivera eller inaktivera enskilda regler under inställningarna.
      </p>
    ),
  },
];

export function GettingStartedPage() {
  return (
    <>
      <DocsHeader title="Kom igång" />
      <div className="p-6">
        <DocsProse>
          <h2>Snabbstart</h2>
          <p>
            Följ dessa fyra steg för att komma igång med Njorda Advisor. Hela
            processen tar bara några minuter.
          </p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsStepList steps={steps} />

          <DocsCallout variant="tip" title="Tips">
            <p>
              Du kan ladda upp flera dokument samtidigt. Systemet bearbetar dem
              parallellt och du kan följa statusen i realtid.
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
