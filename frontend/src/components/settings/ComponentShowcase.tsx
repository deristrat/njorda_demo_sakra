import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FontPicker } from "./FontPicker";

export function ComponentShowcase() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Typography / Font Picker */}
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

      {/* Account details */}
      <Card>
        <CardHeader>
          <CardTitle>Kontouppgifter</CardTitle>
          <CardDescription>
            Uppdatera dina personliga uppgifter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Förnamn</Label>
              <Input id="firstName" defaultValue="Daniel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Efternamn</Label>
              <Input id="lastName" defaultValue="Advisor" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsEmail">E-post</Label>
            <Input
              id="settingsEmail"
              type="email"
              defaultValue="daniel@njorda.se"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsPassword">Lösenord</Label>
            <div className="relative">
              <Input
                id="settingsPassword"
                type={showPassword ? "text" : "password"}
                defaultValue="protectme"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferenser</CardTitle>
          <CardDescription>Anpassa dina inställningar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Språk</Label>
            <Select defaultValue="sv">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sv">Svenska</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="no">Norsk</SelectItem>
                <SelectItem value="da">Dansk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tidszon</Label>
            <Select defaultValue="europe-stockholm">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="europe-stockholm">
                  Europe/Stockholm (CET)
                </SelectItem>
                <SelectItem value="europe-london">
                  Europe/London (GMT)
                </SelectItem>
                <SelectItem value="us-eastern">
                  US/Eastern (EST)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Mörkt läge</Label>
              <p className="text-xs text-muted-foreground">
                Aktivera mörkt färgschema
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Kompakt vy</Label>
              <p className="text-xs text-muted-foreground">
                Minska mellanrum och storlekar
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifikationer</CardTitle>
          <CardDescription>
            Välj vilka aviseringar du vill ta emot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">E-postnotifikationer</Label>
            {[
              "Nya klientförfrågningar",
              "Portföljvarningar",
              "Veckosammanfattning",
              "Systemuppdateringar",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  id={item}
                  defaultChecked={item !== "Systemuppdateringar"}
                />
                <Label htmlFor={item} className="text-sm font-normal">
                  {item}
                </Label>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Frekvens för sammanfattningar
            </Label>
            <RadioGroup defaultValue="weekly">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal">
                  Dagligen
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal">
                  Veckovis
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal">
                  Månadsvis
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Integritet</CardTitle>
          <CardDescription>Hantera dina datapreferenser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea
              id="notes"
              placeholder="Skriv dina anteckningar här..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Datalagring (månader)</Label>
            <Slider defaultValue={[12]} max={36} min={1} step={1} />
            <p className="text-xs text-muted-foreground">
              Historik sparas i 12 månader
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ladda upp fil</Label>
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                Dra och släpp filer här, eller klicka för att välja
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button>Spara ändringar</Button>
        <Button variant="outline">Avbryt</Button>
      </div>
    </div>
  );
}
