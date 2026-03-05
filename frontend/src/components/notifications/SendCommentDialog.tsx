import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMessage } from "@/lib/api";
import { toast } from "sonner";

interface SendCommentDialogProps {
  documentId?: number;
  documentFilename?: string;
  clientId?: number | null;
  advisorId?: number | null;
  advisorName?: string | null;
  defaultSubject?: string;
}

export function SendCommentDialog({
  documentId,
  documentFilename,
  clientId,
  advisorId,
  advisorName,
  defaultSubject,
}: SendCommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSubject(
        defaultSubject ??
        (documentFilename ? `Kommentar: ${documentFilename}` : ""),
      );
      setBody("");
    }
  };

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error("Meddelandet kan inte vara tomt");
      return;
    }
    setSending(true);
    try {
      await createMessage({
        document_id: documentId,
        client_id: clientId ?? undefined,
        advisor_id: advisorId ?? undefined,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success("Meddelande skickat");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte skicka meddelande");
    } finally {
      setSending(false);
    }
  };

  const description = advisorName
    ? `Meddelandet skickas till ${advisorName}.`
    : "Kommentaren skickas till rådgivaren som ansvarar för dokumentet.";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-1 size-4" />
          Skicka meddelande
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skicka meddelande till rådgivare</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Ämne</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Meddelande</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Skriv ditt meddelande här..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Skickar..." : "Skicka"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
