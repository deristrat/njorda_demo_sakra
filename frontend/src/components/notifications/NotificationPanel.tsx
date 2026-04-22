import { useEffect, useState } from "react";
import { ArrowLeft, FileText, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMessages, fetchMessageThread, markMessageRead, replyToMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useLanguage, type Lang } from "@/lib/language";
import type { MessageItem } from "@/types";

const translations = {
  sv: {
    back: "Tillbaka",
    compliance: "Regelefterlevnad",
    statusApproved: "Godkänd",
    statusWarning: "Varning",
    statusRejected: "Underkänd",
    documentFallback: (id: number) => `Dokument #${id}`,
    you: "Du",
    unknown: "Okänd",
    replyPlaceholder: "Skriv ett svar...",
    noMessages: "Inga meddelanden.",
  },
  en: {
    back: "Back",
    compliance: "Compliance",
    statusApproved: "Approved",
    statusWarning: "Warning",
    statusRejected: "Rejected",
    documentFallback: (id: number) => `Document #${id}`,
    you: "You",
    unknown: "Unknown",
    replyPlaceholder: "Type a reply…",
    noMessages: "No messages.",
  },
} satisfies Record<Lang, {
  back: string;
  compliance: string;
  statusApproved: string;
  statusWarning: string;
  statusRejected: string;
  documentFallback: (id: number) => string;
  you: string;
  unknown: string;
  replyPlaceholder: string;
  noMessages: string;
}>;

function scoreColor(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function scoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score == null) return "secondary";
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

interface NotificationPanelProps {
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationPanel({ onUnreadCountChange }: NotificationPanelProps) {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MessageItem | null>(null);
  const [thread, setThread] = useState<MessageItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const currentUserId = Number(localStorage.getItem("auth_user_id"));

  useEffect(() => {
    fetchMessages()
      .then((msgs) => {
        setMessages(msgs);
        onUnreadCountChange?.(msgs.filter((m) => !m.is_read).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = async (msg: MessageItem) => {
    setSelected(msg);
    setReplyText("");

    // Fetch thread
    setThreadLoading(true);
    try {
      const t = await fetchMessageThread(msg.id);
      setThread(t);
    } catch {
      setThread([msg]);
    } finally {
      setThreadLoading(false);
    }

    if (!msg.is_read) {
      try {
        await markMessageRead(msg.id);
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === msg.id ? { ...m, is_read: true } : m,
          );
          onUnreadCountChange?.(updated.filter((m) => !m.is_read).length);
          return updated;
        });
      } catch { /* ignore */ }
    }
  };

  const handleSendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const reply = await replyToMessage(selected.id, replyText.trim());
      setThread((prev) => [...prev, reply]);
      setReplyText("");
      // Update reply count in list
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selected.id ? { ...m, reply_count: m.reply_count + 1 } : m,
        ),
      );
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleBack = () => {
    setSelected(null);
    setThread([]);
    setReplyText("");
  };

  // ── Detail / thread view ──
  if (selected) {
    const root = thread[0] || selected;

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="font-semibold text-base">{root.subject}</h3>

          {root.compliance_score != null && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <span
                className={`text-3xl font-brand font-bold ${scoreColor(root.compliance_score)}`}
              >
                {root.compliance_score}
              </span>
              <div className="text-sm">
                <div className="font-medium">{t.compliance}</div>
                <div className="text-muted-foreground">
                  {root.compliance_status === "green" && t.statusApproved}
                  {root.compliance_status === "yellow" && t.statusWarning}
                  {root.compliance_status === "red" && t.statusRejected}
                </div>
              </div>
            </div>
          )}

          {root.document_id && (
            <a
              href={`/documents/${root.document_id}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <FileText className="size-4" />
              {root.document_filename || t.documentFallback(root.document_id)}
            </a>
          )}

          {/* Thread messages */}
          {threadLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {thread.map((msg) => {
                const isMe = msg.sender_user_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        isMe
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">
                          {isMe ? t.you : (msg.sender_name || t.unknown)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t.replyPlaceholder}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSendReply();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              className="self-end"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // ── Empty state ──
  if (messages.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t.noMessages}
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <button
          key={msg.id}
          onClick={() => handleSelect(msg)}
          className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${
            !msg.is_read ? "bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {!msg.is_read && (
              <span className="size-2 rounded-full bg-primary shrink-0" />
            )}
            <span className="text-sm font-medium truncate flex-1">
              {msg.client_name || msg.subject}
            </span>
            {msg.reply_count > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <MessageSquare className="size-3" />
                {msg.reply_count}
              </Badge>
            )}
            {msg.compliance_score != null && (
              <Badge variant={scoreBadgeVariant(msg.compliance_score)} className="text-xs">
                {msg.compliance_score}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {msg.subject}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatDate(msg.created_at)}
          </div>
        </button>
      ))}
    </div>
  );
}
