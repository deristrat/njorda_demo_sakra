import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLanguage, type Lang } from "@/lib/language";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const translations = {
  sv: {
    headerTitle: "Vanliga frågor",
    heading: "Vanliga frågor (FAQ)",
    intro: "Här hittar du svar på vanligt förekommande frågor om Njorda Advisor.",
    q1: "Vilka filformat stöds?",
    a1: "Just nu stöder systemet PDF-filer. Dokumenten bör vara textbaserade (inte scannade bilder) för bästa resultat. Stöd för fler format kan läggas till i framtiden.",
    q2: "Hur lång tid tar det att bearbeta ett dokument?",
    a2: "Bearbetningstiden beror på dokumentets storlek och komplexitet. De flesta dokument bearbetas inom sekunder. Större dokument med många sidor kan ta upp till en minut.",
    q3: "Kan jag ladda upp flera dokument samtidigt?",
    a3: "Ja, du kan dra och släppa flera PDF-filer samtidigt i uppladdningsytan. Varje dokument bearbetas oberoende och du kan följa statusen i dokumentlistan.",
    q4: "Vad betyder de olika trafikljusfärgerna?",
    a4Intro: "Trafikljusfärgerna indikerar dokumentets regelefterlevnadspoäng:",
    a4Green: "Grön",
    a4GreenDesc: " (≥ 85 poäng) — Uppfyller regelkraven",
    a4Yellow: "Gul",
    a4YellowDesc: " (50–84 poäng) — Behöver uppmärksamhet",
    a4Red: "Röd",
    a4RedDesc: " (< 50 poäng) — Betydande brister",
    q5: "Kan tröskelvärdena för poängsystemet ändras?",
    a5: "Ja, administratörer kan justera tröskelvärdena för grön och gul/röd via inställningssidan. Notera att ändringar påverkar klassificeringen av alla dokument retroaktivt.",
    q6: "Vad är skillnaden mellan Tier 1 och Tier 2 regler?",
    a6: "Tier 1-regler är deterministiska kontroller som verifierar att specifika fält finns i dokumentet. Tier 2-regler använder AI (LLM) för att analysera kvaliteten på innehållet — inte bara om det finns utan om det är relevant och specifikt.",
    q7: "Vad händer om en överordnad regel underkänns?",
    a7: 'Om en föräldraregel underkänns hoppas alla underliggande barnregler automatiskt över. De markeras som "överhoppade" och genererar inga ytterligare poängavdrag. Detta förhindrar dubbelbestraffning.',
    q8: "Kan jag inaktivera enskilda regler?",
    a8: "Ja, administratörer kan aktivera och inaktivera enskilda regler i regelhanteringen under inställningarna. Inaktiverade regler exkluderas helt från poängberäkningen.",
    q9: "Sparas mina dokument säkert?",
    a9: "Ja, alla uppladdade dokument lagras krypterat. Åtkomst begränsas till behöriga användare inom din organisation. Dokumenten behandlas i enlighet med GDPR och tillämpliga dataskyddsregler.",
    q10: "Vad är kommunikationsmodulen?",
    a10: "Kommunikationsmodulen är en kommande funktion som kommer att hjälpa rådgivare att formulera regelrätta och policyenliga kundkommunikationer med hjälp av AI. Den är för närvarande under utveckling.",
  },
  en: {
    headerTitle: "FAQ",
    heading: "Frequently asked questions (FAQ)",
    intro: "Here you will find answers to common questions about Njorda Advisor.",
    q1: "Which file formats are supported?",
    a1: "The system currently supports PDF files. Documents should be text-based (not scanned images) for the best results. Support for additional formats may be added in the future.",
    q2: "How long does it take to process a document?",
    a2: "Processing time depends on the document's size and complexity. Most documents are processed within seconds. Larger documents with many pages can take up to a minute.",
    q3: "Can I upload several documents at once?",
    a3: "Yes, you can drag and drop multiple PDF files into the upload area at the same time. Each document is processed independently and you can track the status in the document list.",
    q4: "What do the different traffic-light colors mean?",
    a4Intro: "The traffic-light colors indicate the document's compliance score:",
    a4Green: "Green",
    a4GreenDesc: " (≥ 85 points) — Meets compliance requirements",
    a4Yellow: "Yellow",
    a4YellowDesc: " (50–84 points) — Needs attention",
    a4Red: "Red",
    a4RedDesc: " (< 50 points) — Significant issues",
    q5: "Can the scoring thresholds be changed?",
    a5: "Yes, administrators can adjust the thresholds for green and yellow/red via the settings page. Note that changes affect the classification of all documents retroactively.",
    q6: "What is the difference between Tier 1 and Tier 2 rules?",
    a6: "Tier 1 rules are deterministic checks that verify specific fields appear in the document. Tier 2 rules use AI (LLM) to analyze the quality of the content — not just whether it exists, but whether it is relevant and specific.",
    q7: "What happens if a parent rule fails?",
    a7: 'If a parent rule fails, all underlying child rules are automatically skipped. They are marked as "skipped" and generate no additional deductions. This prevents double-penalizing.',
    q8: "Can I disable individual rules?",
    a8: "Yes, administrators can enable and disable individual rules in rule management under settings. Disabled rules are completely excluded from scoring.",
    q9: "Are my documents stored securely?",
    a9: "Yes, all uploaded documents are stored encrypted. Access is limited to authorized users within your organization. Documents are handled in accordance with GDPR and applicable data-protection regulations.",
    q10: "What is the communication module?",
    a10: "The communication module is an upcoming feature that will help advisors draft compliant, policy-aligned client communications using AI. It is currently in development.",
  },
} satisfies Record<Lang, Record<string, string>>;

function FAQItemComponent({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors">
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        <span className="text-base font-medium">{item.question}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-2 ml-6 text-[15px] text-foreground leading-[1.7]">
          {item.answer}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DocsFAQPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const faqItems: FAQItem[] = [
    {
      question: t.q1,
      answer: <p>{t.a1}</p>,
    },
    {
      question: t.q2,
      answer: <p>{t.a2}</p>,
    },
    {
      question: t.q3,
      answer: <p>{t.a3}</p>,
    },
    {
      question: t.q4,
      answer: (
        <>
          <p>{t.a4Intro}</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>
              <strong>{t.a4Green}</strong>
              {t.a4GreenDesc}
            </li>
            <li>
              <strong>{t.a4Yellow}</strong>
              {t.a4YellowDesc}
            </li>
            <li>
              <strong>{t.a4Red}</strong>
              {t.a4RedDesc}
            </li>
          </ul>
        </>
      ),
    },
    {
      question: t.q5,
      answer: <p>{t.a5}</p>,
    },
    {
      question: t.q6,
      answer: <p>{t.a6}</p>,
    },
    {
      question: t.q7,
      answer: <p>{t.a7}</p>,
    },
    {
      question: t.q8,
      answer: <p>{t.a8}</p>,
    },
    {
      question: t.q9,
      answer: <p>{t.a9}</p>,
    },
    {
      question: t.q10,
      answer: <p>{t.a10}</p>,
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

        <div className="max-w-3xl mt-6 space-y-2">
          {faqItems.map((item, index) => (
            <FAQItemComponent key={index} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}
