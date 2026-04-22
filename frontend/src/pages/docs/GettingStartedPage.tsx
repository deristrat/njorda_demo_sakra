import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsStepList } from "@/components/docs/DocsStepList";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Kom igång",
    heading: "Snabbstart",
    intro:
      "Följ dessa fyra steg för att komma igång med Säkra. Hela processen tar bara några minuter.",
    step1Title: "Logga in",
    step1Description:
      "Navigera till inloggningssidan och ange dina användaruppgifter. Du kommer att skickas vidare till uppladdningsvyn efter lyckad inloggning.",
    step2Title: "Ladda upp dokument",
    step2Description:
      "Dra och släpp PDF-filer i uppladdningsytan, eller klicka för att välja filer. Systemet börjar automatiskt bearbeta dokumenten och extrahera relevant information.",
    step3Title: "Granska regelefterlevnad",
    step3Description:
      "När dokumenten är bearbetade kan du se deras regelefterlevnadspoäng i dokumentlistan. Klicka på ett dokument för att se detaljerad information om vilka regler som passerat och vilka som behöver åtgärdas.",
    step4Title: "Konfigurera vid behov",
    step4Description:
      "Administratörer kan anpassa tröskelvärden för trafikljussystemet och aktivera eller inaktivera enskilda regler under inställningarna.",
    tipTitle: "Tips",
    tipBody:
      "Du kan ladda upp flera dokument samtidigt. Systemet bearbetar dem parallellt och du kan följa statusen i realtid.",
  },
  en: {
    headerTitle: "Getting started",
    heading: "Quick start",
    intro:
      "Follow these four steps to get started with Säkra. The whole process takes just a few minutes.",
    step1Title: "Log in",
    step1Description:
      "Navigate to the login page and enter your credentials. You will be taken to the upload view after a successful login.",
    step2Title: "Upload documents",
    step2Description:
      "Drag and drop PDF files into the upload area, or click to select files. The system automatically starts processing the documents and extracting relevant information.",
    step3Title: "Review compliance",
    step3Description:
      "Once the documents are processed, you can see their compliance scores in the document list. Click a document to see detailed information about which rules passed and which need attention.",
    step4Title: "Configure as needed",
    step4Description:
      "Administrators can adjust thresholds for the traffic-light system and enable or disable individual rules from the settings.",
    tipTitle: "Tip",
    tipBody:
      "You can upload multiple documents at once. The system processes them in parallel and you can track the status in real time.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function GettingStartedPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const steps = [
    {
      title: t.step1Title,
      description: <p>{t.step1Description}</p>,
    },
    {
      title: t.step2Title,
      description: <p>{t.step2Description}</p>,
    },
    {
      title: t.step3Title,
      description: <p>{t.step3Description}</p>,
    },
    {
      title: t.step4Title,
      description: <p>{t.step4Description}</p>,
    },
  ];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsStepList steps={steps} />

          <DocsCallout variant="tip" title={t.tipTitle}>
            <p>{t.tipBody}</p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
