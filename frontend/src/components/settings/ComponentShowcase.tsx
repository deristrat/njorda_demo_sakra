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
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    typographyTitle: "Typografi",
    typographyDesc: "Välj typsnitt för applikationen",
    accountTitle: "Kontouppgifter",
    accountDesc: "Uppdatera dina personliga uppgifter",
    firstName: "Förnamn",
    lastName: "Efternamn",
    email: "E-post",
    password: "Lösenord",
    preferencesTitle: "Preferenser",
    preferencesDesc: "Anpassa dina inställningar",
    language: "Språk",
    timezone: "Tidszon",
    darkMode: "Mörkt läge",
    darkModeDesc: "Aktivera mörkt färgschema",
    compactView: "Kompakt vy",
    compactViewDesc: "Minska mellanrum och storlekar",
    notificationsTitle: "Notifikationer",
    notificationsDesc: "Välj vilka aviseringar du vill ta emot",
    emailNotifications: "E-postnotifikationer",
    newClientRequests: "Nya klientförfrågningar",
    portfolioAlerts: "Portföljvarningar",
    weeklySummary: "Veckosammanfattning",
    systemUpdates: "Systemuppdateringar",
    summaryFrequency: "Frekvens för sammanfattningar",
    daily: "Dagligen",
    weekly: "Veckovis",
    monthly: "Månadsvis",
    dataPrivacyTitle: "Data & Integritet",
    dataPrivacyDesc: "Hantera dina datapreferenser",
    notes: "Anteckningar",
    notesPlaceholder: "Skriv dina anteckningar här...",
    dataRetention: "Datalagring (månader)",
    historySaved: "Historik sparas i 12 månader",
    uploadFile: "Ladda upp fil",
    dropHere: "Dra och släpp filer här, eller klicka för att välja",
    saveChanges: "Spara ändringar",
    cancel: "Avbryt",
  },
  en: {
    typographyTitle: "Typography",
    typographyDesc: "Choose the font for the application",
    accountTitle: "Account details",
    accountDesc: "Update your personal details",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    preferencesTitle: "Preferences",
    preferencesDesc: "Customize your settings",
    language: "Language",
    timezone: "Time zone",
    darkMode: "Dark mode",
    darkModeDesc: "Enable dark color scheme",
    compactView: "Compact view",
    compactViewDesc: "Reduce spacing and sizes",
    notificationsTitle: "Notifications",
    notificationsDesc: "Choose which alerts you want to receive",
    emailNotifications: "Email notifications",
    newClientRequests: "New client requests",
    portfolioAlerts: "Portfolio alerts",
    weeklySummary: "Weekly summary",
    systemUpdates: "System updates",
    summaryFrequency: "Summary frequency",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    dataPrivacyTitle: "Data & Privacy",
    dataPrivacyDesc: "Manage your data preferences",
    notes: "Notes",
    notesPlaceholder: "Type your notes here…",
    dataRetention: "Data retention (months)",
    historySaved: "History is saved for 12 months",
    uploadFile: "Upload file",
    dropHere: "Drag and drop files here, or click to select",
    saveChanges: "Save changes",
    cancel: "Cancel",
  },
} satisfies Record<Lang, Record<string, string>>;

export function ComponentShowcase() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [showPassword, setShowPassword] = useState(false);

  const emailNotificationItems = [
    { key: "newClientRequests", label: t.newClientRequests },
    { key: "portfolioAlerts", label: t.portfolioAlerts },
    { key: "weeklySummary", label: t.weeklySummary },
    { key: "systemUpdates", label: t.systemUpdates },
  ];

  return (
    <div className="space-y-6">
      {/* Typography / Font Picker */}
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

      {/* Account details */}
      <Card>
        <CardHeader>
          <CardTitle>{t.accountTitle}</CardTitle>
          <CardDescription>
            {t.accountDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t.firstName}</Label>
              <Input id="firstName" defaultValue="Daniel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t.lastName}</Label>
              <Input id="lastName" defaultValue="Advisor" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsEmail">{t.email}</Label>
            <Input
              id="settingsEmail"
              type="email"
              defaultValue="daniel@njorda.se"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsPassword">{t.password}</Label>
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
          <CardTitle>{t.preferencesTitle}</CardTitle>
          <CardDescription>{t.preferencesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.language}</Label>
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
            <Label>{t.timezone}</Label>
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
              <Label>{t.darkMode}</Label>
              <p className="text-xs text-muted-foreground">
                {t.darkModeDesc}
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t.compactView}</Label>
              <p className="text-xs text-muted-foreground">
                {t.compactViewDesc}
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t.notificationsTitle}</CardTitle>
          <CardDescription>
            {t.notificationsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t.emailNotifications}</Label>
            {emailNotificationItems.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <Checkbox
                  id={item.key}
                  defaultChecked={item.key !== "systemUpdates"}
                />
                <Label htmlFor={item.key} className="text-sm font-normal">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t.summaryFrequency}
            </Label>
            <RadioGroup defaultValue="weekly">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal">
                  {t.daily}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal">
                  {t.weekly}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal">
                  {t.monthly}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dataPrivacyTitle}</CardTitle>
          <CardDescription>{t.dataPrivacyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">{t.notes}</Label>
            <Textarea
              id="notes"
              placeholder={t.notesPlaceholder}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.dataRetention}</Label>
            <Slider defaultValue={[12]} max={36} min={1} step={1} />
            <p className="text-xs text-muted-foreground">
              {t.historySaved}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t.uploadFile}</Label>
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                {t.dropHere}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button>{t.saveChanges}</Button>
        <Button variant="outline">{t.cancel}</Button>
      </div>
    </div>
  );
}
