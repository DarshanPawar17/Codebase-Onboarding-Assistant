import { useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  if (inline || !match) {
    return (
      <code className="rounded border border-rule bg-bg-sub px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-200 font-medium" {...props}>
        {children}
      </code>
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  let highlightedCode = codeString;
  if (Prism.languages[lang]) {
    try {
      highlightedCode = Prism.highlight(codeString, Prism.languages[lang], lang);
    } catch {
      highlightedCode = codeString;
    }
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-rule bg-bg-deep shadow-md group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-rule bg-bg-surface px-4 py-2 text-xs font-mono">
        <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-ink-muted hover:bg-bg-hover hover:text-ink transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-good" />
              <span className="text-good font-sans text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="font-sans text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink selection:bg-zinc-800">
        <code
          className={`language-${lang}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}

