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

export function FontSettingsPage() {
  useEffect(() => {
    document.title = "Inställningar — Njorda Advisor";
  }, []);

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
      <AppHeader title="Inställningar" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Typografi</CardTitle>
            <CardDescription>
              Välj typsnitt för applikationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FontPicker />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extraktionsmodell</CardTitle>
            <CardDescription>
              Välj vilken AI-modell som används för dokumentextraktion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Modell</Label>
              <Select
                value={currentModel}
                onValueChange={handleModelChange}
                disabled={saving || models.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Laddar..." />
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
                Modellen som används vid analys av uppladdade dokument.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
