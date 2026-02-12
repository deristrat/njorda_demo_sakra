import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFont } from "@/hooks/use-font";

export function FontPicker() {
  const {
    currentFont,
    changeFont,
    fontOptions,
    currentBrandFont,
    changeBrandFont,
    brandFontOptions,
  } = useFont();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Brödtext</Label>
        <Select value={currentFont} onValueChange={changeFont}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Typsnitt för brödtext och gränssnitt.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Siffror & rubriker (brand)</Label>
        <Select value={currentBrandFont} onValueChange={changeBrandFont}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {brandFontOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Typsnitt för KPI-värden, rubriker och sidomeny.
        </p>
      </div>
    </div>
  );
}
