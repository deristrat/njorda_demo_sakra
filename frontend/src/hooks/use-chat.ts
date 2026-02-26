import { useState, useCallback, useRef } from "react";
import { getAuthHeaders } from "@/lib/auth";

export interface ToolCall {
  name: string;
  id: string;
  label: string;
  status: "running" | "done";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

interface SSEEvent {
  type: string;
  data?: string;
  session_id?: string;
  tool_name?: string;
  tool_id?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    // Prepare assistant message placeholder
    let assistantContent = "";
    let toolCalls: ToolCall[] = [];

    const updateAssistant = () => {
      setMessages((prev) => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0 && copy[lastIdx].role === "assistant") {
          copy[lastIdx] = {
            role: "assistant",
            content: assistantContent,
            toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
          };
        } else {
          copy.push({
            role: "assistant",
            content: assistantContent,
            toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
          });
        }
        return copy;
      });
    };

    // Add empty assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", toolCalls: undefined },
    ]);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          session_id: sessionIdRef.current,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        assistantContent = `Fel: ${res.status} — ${errText}`;
        updateAssistant();
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          switch (event.type) {
            case "session":
              sessionIdRef.current = event.session_id ?? null;
              break;
            case "text_delta":
              assistantContent += event.data ?? "";
              updateAssistant();
              break;
            case "tool_start":
              toolCalls.push({
                name: event.tool_name ?? "",
                id: event.tool_id ?? "",
                label: event.data ?? "",
                status: "running",
              });
              updateAssistant();
              break;
            case "tool_result": {
              const tc = toolCalls.find((t) => t.id === event.tool_id);
              if (tc) tc.status = "done";
              updateAssistant();
              break;
            }
            case "error":
              assistantContent += `\n\nFel: ${event.data}`;
              updateAssistant();
              break;
            case "done":
              break;
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User stopped streaming
      } else {
        assistantContent += "\n\nAnslutningen bröts.";
        updateAssistant();
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        const headers: Record<string, string> = { ...getAuthHeaders() };
        await fetch(`/api/chat/${sessionIdRef.current}`, {
          method: "DELETE",
          headers,
        });
      } catch {
        // ignore
      }
    }
    sessionIdRef.current = null;
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming, clearChat };
}
