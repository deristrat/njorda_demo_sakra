import { useNavigate } from "react-router";
import { ShieldCheck, MessageSquare, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsProse } from "@/components/docs/DocsProse";

const features = [
  {
    icon: ShieldCheck,
    title: "Regelefterlevnad",
    description:
      "Automatisk granskning av rådgivningsdokumentation mot interna policyer, regelverk och branschpraxis.",
    link: "/docs/regelefterlevnad",
  },
  {
    icon: MessageSquare,
    title: "Kommunikation",
    description:
      "AI-stöd för att formulera regelrätta och policyenliga kundkommunikationer.",
    link: "/docs/kommunikation",
  },
  {
    icon: BarChart3,
    title: "Kvalitetsuppföljning",
    description:
      "Aggregerade insikter om regelefterlevnad på team- och företagsnivå för utbildning och uppföljning.",
    link: "/docs/poangsystem",
  },
];

export function DocsHomePage() {
  const navigate = useNavigate();

  return (
    <>
      <DocsHeader title="Dokumentation" />
      <div className="p-6">
        <DocsProse>
          <h2>Välkommen till Säkra</h2>
          <p>
            Säkra är ett AI-drivet verktyg som hjälper finansiella
            rådgivare att säkerställa regelefterlevnad och hantera
            klientdokumentation effektivt. Systemet skannar uppladdade dokument
            och bedömer om de uppfyller gällande krav.
          </p>
          <p>
            Verktyget riktar sig till svenska finansiella rådgivare och deras
            organisationer, med stöd för det svenska regelverket (MiFID II, IDD,
            GDPR m.fl.).
          </p>
        </DocsProse>

        <h3 className="font-brand text-lg tracking-tight mt-8 mb-4">
          Tre huvudområden
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
