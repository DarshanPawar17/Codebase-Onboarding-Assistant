import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Square,
  Sparkles,
  User,
  Copy,
  Check,
  Compass,
  Layers,
  Terminal,
  Bug,
  AlertCircle,
} from "lucide-react";

import CitationLink from "./CitationLink.jsx";
import CodeBlock from "./CodeBlock.jsx";
import { streamChat } from "../api/client.js";

const CATEGORIZED_SUGGESTIONS = [
  {
    category: "Architecture",
    icon: Layers,
    prompts: [
      "Walk me through the overall architecture & request flow",
      "Where are the key database or state models defined?",
    ],
  },
  {
    category: "Getting Started",
    icon: Compass,
    prompts: [
      "What is the main entry point and how does it bootstrap?",
      "What environment variables are required to run this locally?",
    ],
  },
  {
    category: "Testing & APIs",
    icon: Terminal,
    prompts: [
      "How are tests structured and what do they verify?",
      "What public APIs or endpoints does this project expose?",
    ],
  },
];

export default function ChatBox({ repoId, onPreviewCitation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  function stopStreaming() {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setStreaming(false);
  }

  function sendMessage(text) {
    const question = (text ?? input).trim();
    if (!question || streaming) return;
    setError("");
    setInput("");

    const userMsg = { role: "user", content: question };
    const placeholderAssistant = {
      role: "assistant",
      content: "",
      citations: [],
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, placeholderAssistant]);
    setStreaming(true);

    const cancel = streamChat({
      repoId,
      sessionId,
      message: question,
      onEvent: ({ type, data }) => {
        if (type === "meta") {
          if (data.sessionId) setSessionId(data.sessionId);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              last.citations = data.citations || [];
            }
            return next;
          });
        } else if (type === "token") {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              last.content += data.delta || "";
            }
            return next;
          });
        } else if (type === "done") {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              last.streaming = false;
              if (data.fullText) last.content = data.fullText;
            }
            return next;
          });
          setStreaming(false);
        } else if (type === "error") {
          setError(data.error || "Stream error");
          dropEmptyAssistantPlaceholder();
          setStreaming(false);
        }
      },
      onError: (err) => {
        setError(err.message || "Streaming failed.");
        dropEmptyAssistantPlaceholder();
        setStreaming(false);
      },
      onDone: () => {
        setStreaming(false);
      },
    });

    function dropEmptyAssistantPlaceholder() {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
    cancelRef.current = cancel;
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-rule/70 bg-bg-surface/90 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Codebase Assistant</h3>
            <p className="font-mono text-[11px] text-ink-dim">
              Grounded in AST tree-sitter chunks · Hybrid vector retrieval
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="rounded px-2.5 py-1 font-mono text-[11px] text-ink-dim hover:bg-bg-hover hover:text-ink transition-colors"
          >
            Clear chat
          </button>
        )}
      </header>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 && (
          <div className="my-auto flex flex-col justify-center py-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent/20 to-brand-purple/20 text-accent border border-accent/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-ink">
                What would you like to know about this repository?
              </h4>
              <p className="mx-auto mt-1 max-w-md text-xs text-ink-muted">
                Answers cite line ranges directly from the codebase. Select a prompt or type any question below.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto w-full">
              {CATEGORIZED_SUGGESTIONS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.category}
                    className="rounded-xl border border-rule/70 bg-bg-sub/70 p-3.5"
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-accent-soft">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cat.category}</span>
                    </div>
                    <div className="space-y-1.5">
                      {cat.prompts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => sendMessage(p)}
                          className="w-full text-left rounded-lg p-2 text-xs text-ink-muted transition-all hover:bg-accent/10 hover:text-ink hover:border-accent/40"
                        >
                          › {p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Message
            key={i}
            message={m}
            onPreviewCitation={onPreviewCitation}
          />
        ))}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-bad/40 bg-bad/10 p-3.5 text-xs text-bad">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-rule/70 bg-bg-surface/95 p-4"
      >
        <div className="relative flex items-end rounded-xl border border-rule/80 bg-bg-sub/90 focus-within:border-accent/70 focus-within:ring-1 focus-within:ring-accent/70 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about entry points, architecture, functions, logic... (Enter to send)"
            rows={1}
            className="max-h-36 min-h-[46px] flex-1 resize-none bg-transparent px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            disabled={streaming}
          />

          <div className="flex items-center gap-2 pb-2 pr-3">
            {streaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="flex items-center gap-1.5 rounded-lg bg-bad/20 px-3 py-1.5 text-xs font-semibold text-bad hover:bg-bad/30 transition-colors"
                title="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-bg-deep transition-all hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-ink-dim font-mono">
          <span>Shift + Enter for new line</span>
          <span>OpenAI text-embedding-3 + gpt-4o</span>
        </div>
      </form>
    </section>
  );
}

function Message({ message, onPreviewCitation }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  function copyAnswer() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl bg-accent/15 border border-accent/30 px-5 py-3.5 text-sm text-ink shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5 group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-purple/20 text-brand-purple border border-brand-purple/30 mt-0.5">
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-rule/70 bg-bg-sub/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-ruleSoft pb-2">
          <span className="font-mono text-xs font-semibold text-accent-soft">
            Codebase Insight
          </span>
          {message.content && !message.streaming && (
            <button
              onClick={copyAnswer}
              className="flex items-center gap-1 text-[11px] font-mono text-ink-dim hover:text-ink transition-colors"
              title="Copy answer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-good" />
                  <span className="text-good">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="markdown">
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ code: CodeBlock }}
            >
              {message.content}
            </ReactMarkdown>
          ) : message.streaming ? (
            <StreamingDots />
          ) : null}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-5 border-t border-ruleSoft pt-3.5">
            <p className="eyebrow mb-2.5 text-accent-soft flex items-center gap-1.5">
              <span>Grounded Code Sources ({message.citations.length})</span>
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {message.citations.slice(0, 6).map((c, idx) => (
                <CitationLink
                  key={idx}
                  citation={c}
                  index={idx}
                  onPreview={onPreviewCitation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-2">
      <span className="h-1.5 w-1.5 rounded-full animate-bounce bg-accent" />
      <span
        className="h-1.5 w-1.5 rounded-full animate-bounce bg-accent"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full animate-bounce bg-accent"
        style={{ animationDelay: "300ms" }}
      />
    </span>
  );
}
