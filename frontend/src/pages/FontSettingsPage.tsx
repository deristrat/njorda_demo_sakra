import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FontPicker } from "@/components/settings/FontPicker";
import {
  fetchExtractorModels,
  fetchExtractorModel,
  setExtractorModel,
  type ExtractorModel,
} from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    pageTitle: "Inställningar — Säkra",
    headerTitle: "Inställningar",
    typographyTitle: "Typografi",
    typographyDesc: "Välj typsnitt för applikationen",
    extractorTitle: "Extraktionsmodell",
    extractorDesc: "Välj vilken AI-modell som används för dokumentextraktion",
    modelLabel: "Modell",
    loadingPlaceholder: "Laddar...",
    modelHelp: "Modellen som används vid analys av uppladdade dokument.",
  },
  en: {
    pageTitle: "Settings — Säkra",
    headerTitle: "Settings",
    typographyTitle: "Typography",
    typographyDesc: "Choose the font for the application",
    extractorTitle: "Extraction model",
    extractorDesc: "Choose which AI model is used for document extraction",
    modelLabel: "Model",
    loadingPlaceholder: "Loading…",
    modelHelp: "The model used when analyzing uploaded documents.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function FontSettingsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  const [models, setModels] = useState<ExtractorModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchExtractorModels(), fetchExtractorModel()]).then(
      ([modelList, current]) => {
        setModels(modelList);
        setCurrentModel(current);
      },
    );
  }, []);

  const handleModelChange = async (value: string) => {
    setCurrentModel(value);
    setSaving(true);
    try {
      await setExtractorModel(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.typographyTitle}</CardTitle>
            <CardDescription>
              {t.typographyDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FontPicker />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.extractorTitle}</CardTitle>
            <CardDescription>
              {t.extractorDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t.modelLabel}</Label>
              <Select
                value={currentModel}
                onValueChange={handleModelChange}
                disabled={saving || models.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.loadingPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.modelHelp}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
