import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question: "Vilka filformat stöds?",
    answer: (
      <p>
        Just nu stöder systemet PDF-filer. Dokumenten bör vara textbaserade
        (inte scannade bilder) för bästa resultat. Stöd för fler format kan
        läggas till i framtiden.
      </p>
    ),
  },
  {
    question: "Hur lång tid tar det att bearbeta ett dokument?",
    answer: (
      <p>
        Bearbetningstiden beror på dokumentets storlek och komplexitet. De
        flesta dokument bearbetas inom sekunder. Större dokument med många
        sidor kan ta upp till en minut.
      </p>
    ),
  },
  {
    question: "Kan jag ladda upp flera dokument samtidigt?",
    answer: (
      <p>
        Ja, du kan dra och släppa flera PDF-filer samtidigt i
        uppladdningsytan. Varje dokument bearbetas oberoende och du kan följa
        statusen i dokumentlistan.
      </p>
    ),
  },
  {
    question: "Vad betyder de olika trafikljusfärgerna?",
    answer: (
      <>
        <p>
          Trafikljusfärgerna indikerar dokumentets regelefterlevnadspoäng:
        </p>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>
            <strong>Grön</strong> (≥ 85 poäng) — Uppfyller regelkraven
          </li>
          <li>
            <strong>Gul</strong> (50–84 poäng) — Behöver uppmärksamhet
          </li>
          <li>
            <strong>Röd</strong> (&lt; 50 poäng) — Betydande brister
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Kan tröskelvärdena för poängsystemet ändras?",
    answer: (
      <p>
        Ja, administratörer kan justera tröskelvärdena för grön och gul/röd
        via inställningssidan. Notera att ändringar påverkar klassificeringen
        av alla dokument retroaktivt.
      </p>
    ),
  },
  {
    question: "Vad är skillnaden mellan Tier 1 och Tier 2 regler?",
    answer: (
      <>
        <p>
          Tier 1-regler är deterministiska kontroller som verifierar att
          specifika fält finns i dokumentet. Tier 2-regler använder AI (LLM)
          för att analysera kvaliteten på innehållet — inte bara om det finns
          utan om det är relevant och specifikt.
        </p>
      </>
    ),
  },
  {
    question: "Vad händer om en överordnad regel underkänns?",
    answer: (
      <p>
        Om en föräldraregel underkänns hoppas alla underliggande barnregler
        automatiskt över. De markeras som "överhoppade" och genererar inga
        ytterligare poängavdrag. Detta förhindrar dubbelbestraffning.
      </p>
    ),
  },
  {
    question: "Kan jag inaktivera enskilda regler?",
    answer: (
      <p>
        Ja, administratörer kan aktivera och inaktivera enskilda regler i
        regelhanteringen under inställningarna. Inaktiverade regler
        exkluderas helt från poängberäkningen.
      </p>
    ),
  },
  {
    question: "Sparas mina dokument säkert?",
    answer: (
      <p>
        Ja, alla uppladdade dokument lagras krypterat. Åtkomst begränsas till
        behöriga användare inom din organisation. Dokumenten behandlas i
        enlighet med GDPR och tillämpliga dataskyddsregler.
      </p>
    ),
  },
  {
    question: "Vad är kommunikationsmodulen?",
    answer: (
      <p>
        Kommunikationsmodulen är en kommande funktion som kommer att hjälpa
        rådgivare att formulera regelrätta och policyenliga kundkommunikationer
        med hjälp av AI. Den är för närvarande under utveckling.
      </p>
    ),
  },
];

function FAQItemComponent({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors">
        <ChevronRight
          className={`size-4 shrink-0 text-foreground/40 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        <span className="text-base font-medium">{item.question}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-2 ml-6 text-[15px] text-foreground/70 leading-relaxed">
          {item.answer}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DocsFAQPage() {
  return (
    <>
      <DocsHeader title="Vanliga frågor" />
      <div className="p-6">
        <DocsProse>
          <h2>Vanliga frågor (FAQ)</h2>
          <p>
            Här hittar du svar på vanligt förekommande frågor om Njorda
            Advisor.
          </p>
        </DocsProse>

        <div className="max-w-3xl mt-6 space-y-2">
          {faqItems.map((item, index) => (
            <FAQItemComponent key={index} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}
