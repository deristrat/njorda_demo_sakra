import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          toast.success("Framgång", {
            description: "Portföljen har uppdaterats för alla klienter.",
          })
        }
      >
        Framgång
      </Button>
      <Button
        variant="outline"
        className="border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={() =>
          toast.warning("Varning", {
            description: "3 klienter har inte kontaktats på över 30 dagar.",
          })
        }
      >
        Varning
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast.error("Fel", {
            description:
              "Kunde inte synkronisera data med depåbanken. Försök igen.",
          })
        }
      >
        Fel
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.info("Info", {
            description: "Nästa kvartalsmöte är planerat till 15 mars.",
          })
        }
      >
        Info
      </Button>
    </div>
  );
}
