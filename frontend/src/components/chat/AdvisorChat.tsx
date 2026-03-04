import { useRef, useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Wrench, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChat, type ChatMessage, type ToolCall } from "@/lib/chat-context";

const DEFAULT_SUGGESTIONS = [
  "Vilka klienter har jag?",
  "Vilka dokument har avvikelser?",
  "Sammanfatta mitt dokumentläge",
];

const DEFAULT_SUBTITLE = "Fråga om dina klienter, dokument eller compliance-status";

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
    <Card className={`flex flex-col ${expanded ? "flex-1 min-h-0 overflow-hidden" : "h-[480px]"}`}>
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
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ställ en fråga..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isStreaming}
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
