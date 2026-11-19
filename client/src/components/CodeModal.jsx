import { useEffect, useState } from "react";
import { X, ExternalLink, Copy, Check, FileCode, Sparkles } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";

function detectLanguage(filePath) {
  if (!filePath) return "javascript";
  if (filePath.endsWith(".ts")) return "typescript";
  if (filePath.endsWith(".tsx")) return "tsx";
  if (filePath.endsWith(".jsx")) return "jsx";
  if (filePath.endsWith(".py")) return "python";
  if (filePath.endsWith(".json")) return "json";
  return "javascript";
}

export default function CodeModal({ citation, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!citation) return null;

  const lang = citation.language || detectLanguage(citation.filePath);
  const code = citation.snippet || "// Code snippet not cached in preview.\n// Click 'Open on GitHub' to view full file.";
  const lineRange =
    citation.startLine && citation.endLine && citation.startLine !== citation.endLine
      ? `L${citation.startLine} - L${citation.endLine}`
      : citation.startLine
      ? `Line ${citation.startLine}`
      : "";

  let highlightedCode = code;
  if (Prism.languages[lang]) {
    try {
      highlightedCode = Prism.highlight(code, Prism.languages[lang], lang);
    } catch {
      highlightedCode = code;
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-2xl border border-rule/80 bg-bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-rule bg-bg-soft px-5 py-3.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60">
              <FileCode className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-ink truncate">
                  {citation.filePath}
                </span>
                {lineRange && (
                  <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-200">
                    {lineRange}
                  </span>
                )}
              </div>
              {citation.name && (
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span className="font-mono text-zinc-300">{citation.name}</span>
                  {citation.type && (
                    <span className="text-ink-faint">({citation.type})</span>
                  )}
                  {typeof citation.score === "number" && (
                    <>
                      <span className="text-ink-faint">·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <Sparkles className="h-3 w-3" />
                        {(citation.score * 100).toFixed(0)}% match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-rule bg-bg-sub/80 px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-zinc-500 hover:text-ink transition-colors"
              title="Copy snippet"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-good" />
                  <span className="text-good">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-rule bg-bg-sub/80 px-3 py-1.5 text-xs font-medium text-ink hover:border-zinc-500 hover:text-white transition-colors"
                title="Open on GitHub"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-bg-hover hover:text-ink transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-bg-deep p-5 font-mono text-[13px] leading-relaxed">
          <pre>
            <code
              className={`language-${lang}`}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-rule/60 bg-bg-soft/40 px-5 py-2.5 text-[11px] text-ink-dim font-mono">
          <span>Language: {lang}</span>
          <span>Press ESC or click outside to dismiss</span>
        </div>
      </div>
    </div>
  );
}

