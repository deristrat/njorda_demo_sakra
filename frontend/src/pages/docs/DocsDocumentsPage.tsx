import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { DocsCallout } from "@/components/docs/DocsCallout";

export function DocsDocumentsPage() {
  return (
    <>
      <DocsHeader title="Arbeta med dokument" />
      <div className="p-6">
        <DocsProse>
          <h2>Arbeta med dokument</h2>
          <p>
            Dokumentsidan ger en översikt av alla uppladdade dokument med
            möjlighet att sortera, filtrera och granska varje enskilt dokument i
            detalj.
          </p>

          <h3>Dokumentlistan</h3>
          <p>
            Listan visar alla dokument med följande kolumner:
          </p>
          <ul>
            <li>
              <strong>Namn</strong> — Dokumentets filnamn
            </li>
            <li>
              <strong>Typ</strong> — Dokumenttyp (t.ex. rådgivningsdokumentation,
              pensionsflytt)
            </li>
            <li>
              <strong>Status</strong> — Bearbetningsstatus (bearbetar, klar,
              fel)
            </li>
            <li>
              <strong>Poäng</strong> — Regelefterlevnadspoäng med
              trafikljusfärg
            </li>
            <li>
              <strong>Uppladdad</strong> — Datum och tid för uppladdning
            </li>
          </ul>

          <h3>Sortering och filtrering</h3>
          <p>
            Klicka på kolumnrubriker för att sortera listan. Du kan även
            filtrera dokument efter status, typ eller poängintervall med hjälp
            av filtermenyerna ovanför listan.
          </p>

          <h3>Detaljvy</h3>
          <p>
            Klicka på ett dokument i listan för att öppna dess detaljvy.
            Detaljvyn visar:
          </p>
          <ul>
            <li>
              <strong>PDF-visning</strong> — Det ursprungliga dokumentet
              renderat i en PDF-läsare
            </li>
            <li>
              <strong>Extraherad data</strong> — Metadata och nyckelfält som
              systemet har identifierat
            </li>
            <li>
              <strong>Regelefterlevnad</strong> — Komplett regelgranskning med
              status per regel
            </li>
          </ul>
        </DocsProse>

        <div className="max-w-3xl">
          <DocsCallout variant="tip" title="Tips">
            <p>
              Använd tangentkombinationen <code>Ctrl+F</code> (eller{" "}
              <code>Cmd+F</code> på Mac) för att söka i PDF-visningen.
            </p>
          </DocsCallout>
        </div>
      </div>
    </>
  );
}
