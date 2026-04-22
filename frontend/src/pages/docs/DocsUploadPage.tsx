import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsStepList } from "@/components/docs/DocsStepList";
import { Badge } from "@/components/ui/badge";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Ladda upp dokument",
    heading: "Ladda upp dokument",
    intro:
      "Uppladdningssidan är din startpunkt i Säkra. Härifrån laddar du upp rådgivningsdokumentation som systemet sedan granskar automatiskt.",
    fileFormatsHeading: "Filformat",
    fileFormatsIntro: "Systemet stöder ",
    fileFormatsStrong: "PDF-filer",
    fileFormatsOutro:
      ". Dokumenten bör vara textbaserade (inte scannade bilder) för bästa resultat vid textextraktion.",
    howItWorksHeading: "Så fungerar uppladdningen",
    step1Title: "Dra och släpp eller välj filer",
    step1Description:
      "Dra en eller flera PDF-filer till uppladdningsytan på startsidan. Du kan också klicka på ytan för att öppna filväljaren.",
    step2Title: "Automatisk bearbetning",
    step2Description:
      "Systemet identifierar dokumenttyp, extraherar text och metadata, och påbörjar regelefterlevnadsgranskning automatiskt.",
    step3Title: "Följ statusen",
    step3Description:
      "Varje dokument visar en statusindikator under bearbetning. När granskningen är klar visas en regelefterlevnadspoäng.",
    statusHeading: "Statusindikationer",
    statusIntro: "Under och efter bearbetning ser du följande statusar:",
    statusUploading: "Laddar upp",
    statusUploadingDesc: "Filen överförs till servern",
    statusProcessing: "Bearbetar",
    statusProcessingDesc: "Text och metadata extraheras",
    statusReviewing: "Granskar",
    statusReviewingDesc: "Regelefterlevnad utvärderas",
    statusDone: "Klar",
    statusDoneDesc: "Granskning slutförd — poäng tillgänglig",
    calloutTitle: "Flera dokument",
    calloutBody:
      "Du kan ladda upp flera dokument samtidigt. Varje dokument bearbetas oberoende och du kan följa framstegen i dokumentlistan.",
  },
  en: {
    headerTitle: "Upload documents",
    heading: "Upload documents",
    intro:
      "The upload page is your starting point in Säkra. From here you upload advisory documentation, which the system then reviews automatically.",
    fileFormatsHeading: "File formats",
    fileFormatsIntro: "The system supports ",
    fileFormatsStrong: "PDF files",
    fileFormatsOutro:
      ". Documents should be text-based (not scanned images) for the best text-extraction results.",
    howItWorksHeading: "How uploads work",
    step1Title: "Drag and drop or select files",
    step1Description:
      "Drag one or more PDF files onto the upload area on the home page. You can also click the area to open the file picker.",
    step2Title: "Automatic processing",
    step2Description:
      "The system identifies the document type, extracts text and metadata, and starts the compliance review automatically.",
    step3Title: "Track the status",
    step3Description:
      "Each document shows a status indicator during processing. When the review is complete, a compliance score is displayed.",
    statusHeading: "Status indicators",
    statusIntro: "During and after processing you will see the following statuses:",
    statusUploading: "Uploading",
    statusUploadingDesc: "The file is being transferred to the server",
    statusProcessing: "Processing",
    statusProcessingDesc: "Text and metadata are being extracted",
    statusReviewing: "Reviewing",
    statusReviewingDesc: "Compliance is being evaluated",
    statusDone: "Done",
    statusDoneDesc: "Review complete — score available",
    calloutTitle: "Multiple documents",
    calloutBody:
      "You can upload several documents at once. Each document is processed independently and you can track progress in the document list.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsUploadPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const uploadSteps = [
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
  ];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>

          <h3>{t.fileFormatsHeading}</h3>
          <p>
            {t.fileFormatsIntro}
            <strong>{t.fileFormatsStrong}</strong>
            {t.fileFormatsOutro}
          </p>

          <h3>{t.howItWorksHeading}</h3>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsStepList steps={uploadSteps} />
        </div>

        <DocsProse>
          <h3>{t.statusHeading}</h3>
          <p>{t.statusIntro}</p>
        </DocsProse>

        <div className="max-w-3xl space-y-2 my-4">
          <div className="flex items-center gap-3 text-base">
            <Badge variant="outline" className="w-28 justify-center text-sm">
              {t.statusUploading}
            </Badge>
            <span className="text-foreground">{t.statusUploadingDesc}</span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <Badge variant="outline" className="w-28 justify-center text-sm">
              {t.statusProcessing}
            </Badge>
            <span className="text-foreground">{t.statusProcessingDesc}</span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <Badge variant="outline" className="w-28 justify-center text-sm">
              {t.statusReviewing}
            </Badge>
            <span className="text-foreground">{t.statusReviewingDesc}</span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <Badge className="w-28 justify-center bg-primary text-sm">
              {t.statusDone}
            </Badge>
            <span className="text-foreground">{t.statusDoneDesc}</span>
          </div>
        </div>

        <div className="max-w-3xl">
          <DocsCallout variant="info" title={t.calloutTitle}>
            <p>{t.calloutBody}</p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
