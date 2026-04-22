import { useNavigate } from "react-router";
import { ShieldCheck, MessageSquare, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    headerTitle: "Dokumentation",
    welcomeHeading: "Välkommen till Säkra",
    introParagraph1:
      "Säkra är ett AI-drivet verktyg som hjälper finansiella rådgivare att säkerställa regelefterlevnad och hantera klientdokumentation effektivt. Systemet skannar uppladdade dokument och bedömer om de uppfyller gällande krav.",
    introParagraph2:
      "Verktyget riktar sig till svenska finansiella rådgivare och deras organisationer, med stöd för det svenska regelverket (MiFID II, IDD, GDPR m.fl.).",
    mainAreasHeading: "Tre huvudområden",
    featureComplianceTitle: "Regelefterlevnad",
    featureComplianceDescription:
      "Automatisk granskning av rådgivningsdokumentation mot interna policyer, regelverk och branschpraxis.",
    featureCommunicationTitle: "Kommunikation",
    featureCommunicationDescription:
      "AI-stöd för att formulera regelrätta och policyenliga kundkommunikationer.",
    featureQualityTitle: "Kvalitetsuppföljning",
    featureQualityDescription:
      "Aggregerade insikter om regelefterlevnad på team- och företagsnivå för utbildning och uppföljning.",
  },
  en: {
    headerTitle: "Documentation",
    welcomeHeading: "Welcome to Säkra",
    introParagraph1:
      "Säkra is an AI-powered tool that helps financial advisors stay compliant and manage client documentation efficiently. The system scans uploaded documents and assesses whether they meet applicable requirements.",
    introParagraph2:
      "The tool is aimed at Swedish financial advisors and their organizations, with support for the Swedish regulatory framework (MiFID II, IDD, GDPR and more).",
    mainAreasHeading: "Three main areas",
    featureComplianceTitle: "Compliance",
    featureComplianceDescription:
      "Automatic review of advisory documentation against internal policies, regulations, and industry best practices.",
    featureCommunicationTitle: "Communication",
    featureCommunicationDescription:
      "AI support for drafting compliant, policy-aligned client communications.",
    featureQualityTitle: "Quality assurance",
    featureQualityDescription:
      "Aggregated compliance insights at team and company level for training and follow-up.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsHomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  const features = [
    {
      icon: ShieldCheck,
      title: t.featureComplianceTitle,
      description: t.featureComplianceDescription,
      link: "/docs/regelefterlevnad",
    },
    {
      icon: MessageSquare,
      title: t.featureCommunicationTitle,
      description: t.featureCommunicationDescription,
      link: "/docs/kommunikation",
    },
    {
      icon: BarChart3,
      title: t.featureQualityTitle,
      description: t.featureQualityDescription,
      link: "/docs/poangsystem",
    },
  ];

  return (
    <>
      <DocsHeader title={t.headerTitle} />
      <div className="p-6">
        <DocsProse>
          <h2>{t.welcomeHeading}</h2>
          <p>{t.introParagraph1}</p>
          <p>{t.introParagraph2}</p>
        </DocsProse>

        <h3 className="font-brand text-lg tracking-tight mt-8 mb-4">
          {t.mainAreasHeading}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => navigate(feature.link)}
            >
              <CardHeader>
                <feature.icon className="size-8 text-primary mb-2" />
                <CardTitle className="text-base font-medium">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
