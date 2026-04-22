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
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    commentPrefix: (filename: string) => `Kommentar: ${filename}`,
    errorEmpty: "Meddelandet kan inte vara tomt",
    successSent: "Meddelande skickat",
    errorSend: "Kunde inte skicka meddelande",
    descWithAdvisor: (name: string) => `Meddelandet skickas till ${name}.`,
    descFallback: "Kommentaren skickas till rådgivaren som ansvarar för dokumentet.",
    sendMessage: "Skicka meddelande",
    dialogTitle: "Skicka meddelande till rådgivare",
    subjectLabel: "Ämne",
    bodyLabel: "Meddelande",
    bodyPlaceholder: "Skriv ditt meddelande här...",
    cancel: "Avbryt",
    sending: "Skickar...",
    send: "Skicka",
  },
  en: {
    commentPrefix: (filename: string) => `Comment: ${filename}`,
    errorEmpty: "The message cannot be empty",
    successSent: "Message sent",
    errorSend: "Could not send message",
    descWithAdvisor: (name: string) => `The message will be sent to ${name}.`,
    descFallback: "The comment will be sent to the advisor responsible for the document.",
    sendMessage: "Send message",
    dialogTitle: "Send message to advisor",
    subjectLabel: "Subject",
    bodyLabel: "Message",
    bodyPlaceholder: "Type your message here…",
    cancel: "Cancel",
    sending: "Sending…",
    send: "Send",
  },
} satisfies Record<Lang, {
  commentPrefix: (filename: string) => string;
  errorEmpty: string;
  successSent: string;
  errorSend: string;
  descWithAdvisor: (name: string) => string;
  descFallback: string;
  sendMessage: string;
  dialogTitle: string;
  subjectLabel: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  cancel: string;
  sending: string;
  send: string;
}>;

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
  const { lang } = useLanguage();
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSubject(
        defaultSubject ??
        (documentFilename ? t.commentPrefix(documentFilename) : ""),
      );
      setBody("");
    }
  };

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error(t.errorEmpty);
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
      toast.success(t.successSent);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.errorSend);
    } finally {
      setSending(false);
    }
  };

  const description = advisorName
    ? t.descWithAdvisor(advisorName)
    : t.descFallback;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-1 size-4" />
          {t.sendMessage}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.dialogTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t.subjectLabel}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">{t.bodyLabel}</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder={t.bodyPlaceholder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? t.sending : t.send}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
