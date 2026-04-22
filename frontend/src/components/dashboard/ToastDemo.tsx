import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    success: "Framgång",
    successDesc: "Portföljen har uppdaterats för alla klienter.",
    warning: "Varning",
    warningDesc: "3 klienter har inte kontaktats på över 30 dagar.",
    error: "Fel",
    errorDesc: "Kunde inte synkronisera data med depåbanken. Försök igen.",
    info: "Info",
    infoDesc: "Nästa kvartalsmöte är planerat till 15 mars.",
  },
  en: {
    success: "Success",
    successDesc: "The portfolio has been updated for all clients.",
    warning: "Warning",
    warningDesc: "3 clients have not been contacted in over 30 days.",
    error: "Error",
    errorDesc: "Could not sync data with the custodian bank. Try again.",
    info: "Info",
    infoDesc: "The next quarterly meeting is scheduled for March 15.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function ToastDemo() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          toast.success(t.success, {
            description: t.successDesc,
          })
        }
      >
        {t.success}
      </Button>
      <Button
        variant="outline"
        className="border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={() =>
          toast.warning(t.warning, {
            description: t.warningDesc,
          })
        }
      >
        {t.warning}
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast.error(t.error, {
            description: t.errorDesc,
          })
        }
      >
        {t.error}
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.info(t.info, {
            description: t.infoDesc,
          })
        }
      >
        {t.info}
      </Button>
    </div>
  );
}
