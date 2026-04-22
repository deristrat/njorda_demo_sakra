import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Arbeta med dokument",
    heading: "Arbeta med dokument",
    intro:
      "Dokumentsidan ger en översikt av alla uppladdade dokument med möjlighet att sortera, filtrera och granska varje enskilt dokument i detalj.",
    listHeading: "Dokumentlistan",
    listIntro: "Listan visar alla dokument med följande kolumner:",
    listItemNameStrong: "Namn",
    listItemName: " — Dokumentets filnamn",
    listItemTypeStrong: "Typ",
    listItemType:
      " — Dokumenttyp (t.ex. rådgivningsdokumentation, pensionsflytt)",
    listItemStatusStrong: "Status",
    listItemStatus: " — Bearbetningsstatus (bearbetar, klar, fel)",
    listItemScoreStrong: "Poäng",
    listItemScore: " — Regelefterlevnadspoäng med trafikljusfärg",
    listItemUploadedStrong: "Uppladdad",
    listItemUploaded: " — Datum och tid för uppladdning",
    sortingHeading: "Sortering och filtrering",
    sortingBody:
      "Klicka på kolumnrubriker för att sortera listan. Du kan även filtrera dokument efter status, typ eller poängintervall med hjälp av filtermenyerna ovanför listan.",
    detailHeading: "Detaljvy",
    detailIntro:
      "Klicka på ett dokument i listan för att öppna dess detaljvy. Detaljvyn visar:",
    detailItemPdfStrong: "PDF-visning",
    detailItemPdf: " — Det ursprungliga dokumentet renderat i en PDF-läsare",
    detailItemDataStrong: "Extraherad data",
    detailItemData:
      " — Metadata och nyckelfält som systemet har identifierat",
    detailItemComplianceStrong: "Regelefterlevnad",
    detailItemCompliance: " — Komplett regelgranskning med status per regel",
    tipTitle: "Tips",
    tipTextBefore: "Använd tangentkombinationen ",
    tipTextMiddle: " (eller ",
    tipTextAfter: " på Mac) för att söka i PDF-visningen.",
  },
  en: {
    headerTitle: "Working with documents",
    heading: "Working with documents",
    intro:
      "The documents page gives you an overview of all uploaded documents with options to sort, filter, and review each one in detail.",
    listHeading: "The document list",
    listIntro: "The list shows all documents with the following columns:",
    listItemNameStrong: "Name",
    listItemName: " — The document's file name",
    listItemTypeStrong: "Type",
    listItemType:
      " — Document type (e.g. advisory documentation, pension transfer)",
    listItemStatusStrong: "Status",
    listItemStatus: " — Processing status (processing, done, error)",
    listItemScoreStrong: "Score",
    listItemScore: " — Compliance score with traffic-light color",
    listItemUploadedStrong: "Uploaded",
    listItemUploaded: " — Upload date and time",
    sortingHeading: "Sorting and filtering",
    sortingBody:
      "Click column headers to sort the list. You can also filter documents by status, type, or score range using the filter menus above the list.",
    detailHeading: "Detail view",
    detailIntro:
      "Click a document in the list to open its detail view. The detail view shows:",
    detailItemPdfStrong: "PDF view",
    detailItemPdf: " — The original document rendered in a PDF viewer",
    detailItemDataStrong: "Extracted data",
    detailItemData:
      " — Metadata and key fields the system has identified",
    detailItemComplianceStrong: "Compliance",
    detailItemCompliance: " — Full rule review with status per rule",
    tipTitle: "Tip",
    tipTextBefore: "Use the keyboard shortcut ",
    tipTextMiddle: " (or ",
    tipTextAfter: " on Mac) to search within the PDF view.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsDocumentsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>

          <h3>{t.listHeading}</h3>
          <p>{t.listIntro}</p>
          <ul>
            <li>
              <strong>{t.listItemNameStrong}</strong>
              {t.listItemName}
            </li>
            <li>
              <strong>{t.listItemTypeStrong}</strong>
              {t.listItemType}
            </li>
            <li>
              <strong>{t.listItemStatusStrong}</strong>
              {t.listItemStatus}
            </li>
            <li>
              <strong>{t.listItemScoreStrong}</strong>
              {t.listItemScore}
            </li>
            <li>
              <strong>{t.listItemUploadedStrong}</strong>
              {t.listItemUploaded}
            </li>
          </ul>

          <h3>{t.sortingHeading}</h3>
          <p>{t.sortingBody}</p>

          <h3>{t.detailHeading}</h3>
          <p>{t.detailIntro}</p>
          <ul>
            <li>
              <strong>{t.detailItemPdfStrong}</strong>
              {t.detailItemPdf}
            </li>
            <li>
              <strong>{t.detailItemDataStrong}</strong>
              {t.detailItemData}
            </li>
            <li>
              <strong>{t.detailItemComplianceStrong}</strong>
              {t.detailItemCompliance}
            </li>
          </ul>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="tip" title={t.tipTitle}>
            <p>
              {t.tipTextBefore}
              <code>Ctrl+F</code>
              {t.tipTextMiddle}
              <code>Cmd+F</code>
              {t.tipTextAfter}
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
