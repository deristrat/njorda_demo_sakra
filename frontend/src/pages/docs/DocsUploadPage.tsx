import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsStepList } from "@/components/docs/DocsStepList";
import { Badge } from "@/components/ui/badge";

const uploadSteps = [
  {
    title: "Dra och släpp eller välj filer",
    description: (
      <p>
        Dra en eller flera PDF-filer till uppladdningsytan på startsidan. Du kan
        också klicka på ytan för att öppna filväljaren.
      </p>
    ),
  },
  {
    title: "Automatisk bearbetning",
    description: (
      <p>
        Systemet identifierar dokumenttyp, extraherar text och metadata, och
        påbörjar regelefterlevnadsgranskning automatiskt.
      </p>
    ),
  },
  {
    title: "Följ statusen",
    description: (
      <p>
        Varje dokument visar en statusindikator under bearbetning. När
        granskningen är klar visas en regelefterlevnadspoäng.
      </p>
    ),
  },
];

export function DocsUploadPage() {
  return (
    <>
      <DocsHeader title="Ladda upp dokument" />
      <div className="p-6">
        <DocsProse>
          <h2>Ladda upp dokument</h2>
          <p>
            Uppladdningssidan är din startpunkt i Säkra. Härifrån
            laddar du upp rådgivningsdokumentation som systemet sedan granskar
            automatiskt.
          </p>

          <h3>Filformat</h3>
          <p>
            Systemet stöder <strong>PDF-filer</strong>. Dokumenten bör vara
            textbaserade (inte scannade bilder) för bästa resultat vid
            textextraktion.
          </p>

          <h3>Så fungerar uppladdningen</h3>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsStepList steps={uploadSteps} />
        </div>

        <DocsProse>
          <h3>Statusindikationer</h3>
          <p>Under och efter bearbetning ser du följande statusar:</p>
        </DocsProse>

        <div className="max-w-3xl space-y-2 my-4">
          <div className="flex items-center gap-3 text-base">
            <Badge variant="outline" className="w-28 justify-center text-sm">
              Laddar upp
            </Badge>
            <span className="text-foreground">
              Filen överförs till servern
            </span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <Badge variant="outline" className="w-28 justify-center text-sm">
              Bearbetar
            </Badge>
            <span className="text-foreground">
              Text och metadata extraheras
            </span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <Badge variant="outline" className="w-28 justify-center text-sm">
              Granskar
            </Badge>
            <span className="text-foreground">
              Regelefterlevnad utvärderas
            </span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <Badge className="w-28 justify-center bg-primary text-sm">Klar</Badge>
            <span className="text-foreground">
              Granskning slutförd — poäng tillgänglig
            </span>
          </div>
        </div>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title="Flera dokument">
            <p>
              Du kan ladda upp flera dokument samtidigt. Varje dokument
              bearbetas oberoende och du kan följa framstegen i dokumentlistan.
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
