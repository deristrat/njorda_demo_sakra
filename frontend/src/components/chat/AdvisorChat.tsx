import { useRef, useEffect, useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Wrench, Square, Trash2, Send, Loader2, Paperclip, Upload } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChat, type ChatMessage, type ToolCall } from "@/lib/chat-context";
import { uploadDocuments, processDocumentsSSE } from "@/lib/api";

const DEFAULT_SUGGESTIONS = [
  "Vilka klienter har jag?",
  "Vilka dokument har avvikelser?",
  "Sammanfatta mitt dokumentläge",
];

const DEFAULT_SUBTITLE = "Skriv en fråga, klistra in mötesanteckningar eller ladda upp ett dokument – jag hjälper dig strukturera ett rådgivningsunderlag.";

function ToolCallBadge({ tool }: { tool: ToolCall }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      {tool.status === "running" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Wrench className="size-3" />
      )}
      {tool.label}
    </span>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-emerald-50 text-foreground"
            : "bg-muted/40 text-foreground"
        }`}
      >
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {msg.toolCalls.map((tc) => (
              <ToolCallBadge key={tc.id} tool={tc} />
            ))}
          </div>
        )}
        {msg.content && (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-table:my-1 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:border prose-td:border prose-headings:my-2">
            <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
          </div>
        )}
        {!msg.content && msg.toolCalls && msg.toolCalls.some(t => t.status === "running") && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Tänker...
          </div>
        )}
      </div>
    </div>
  );
}

interface AdvisorChatProps {
  expanded?: boolean;
  suggestions?: string[];
  subtitle?: string;
}

export function AdvisorChat({
  expanded = false,
  suggestions = DEFAULT_SUGGESTIONS,
  subtitle = DEFAULT_SUBTITLE,
}: AdvisorChatProps) {
  const { messages, isStreaming, sendMessage, stopStreaming, clearChat } =
    useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  const uploadAndChat = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setFileUploading(true);
      try {
        const result = await uploadDocuments(files);
        const docIds = result.documents.map((d) => d.id);
        processDocumentsSSE(docIds, () => {}, () => {}, () => {});
        const names = files.map((f) => f.name).join(", ");
        await sendMessage(
          files.length === 1
            ? `Jag har laddat upp dokumentet "${names}". Kan du granska det?`
            : `Jag har laddat upp ${files.length} dokument: ${names}. Kan du granska dem?`,
        );
      } catch (err) {
        console.error("File upload error:", err);
      } finally {
        setFileUploading(false);
      }
    },
    [sendMessage],
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOver(false);
      uploadAndChat(Array.from(e.dataTransfer.files));
    },
    [uploadAndChat],
  );

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  return (
    <Card
      className={`relative flex flex-col ${expanded ? "flex-1 min-h-0 overflow-hidden" : "h-[480px]"}`}
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounterRef.current++;
        setDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setDragOver(false);
      }}
      onDrop={handleFileDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Upload className="size-6 text-primary" />
            <p className="text-sm font-medium text-primary">
              Släpp för att ladda upp
            </p>
          </div>
        </div>
      )}
      <CardHeader className="flex-none border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
              <Bot className="size-4 text-primary" />
            </div>
            <span className="font-brand text-sm font-medium">AI Assistent</span>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={clearChat}
            >
              <Trash2 className="size-3" />
              Rensa
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Bot className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Hur kan jag hjälpa dig?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {subtitle}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
        </div>

        {/* Input area */}
        <div className="flex-none border-t px-3 py-2">
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="mb-0.5 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || fileUploading}
              title="Ladda upp dokument"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) uploadAndChat(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={fileUploading ? "Laddar upp dokument..." : "Ställ en fråga..."}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isStreaming || fileUploading}
            />
            {isStreaming ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={stopStreaming}
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
