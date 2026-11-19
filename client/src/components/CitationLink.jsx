import { ExternalLink, Code2, Sparkles } from "lucide-react";

export default function CitationLink({ citation, index, onPreview }) {
  if (!citation) return null;
  const lineRange =
    citation.startLine && citation.endLine && citation.startLine !== citation.endLine
      ? `${citation.startLine}-${citation.endLine}`
      : citation.startLine || "";

  function handleClick(e) {
    if (onPreview) {
      e.preventDefault();
      onPreview(citation);
    }
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-lg border border-rule bg-bg-sub/80 px-3 py-2 text-xs transition-all hover:border-zinc-500 hover:bg-bg-soft">
      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        title="Click to preview code"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bg-deep font-mono text-[10px] text-ink-dim group-hover:text-white">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1 truncate">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-ink group-hover:text-white transition-colors truncate">
              {citation.filePath}
            </span>
            {lineRange && (
              <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                :{lineRange}
              </span>
            )}
          </div>

          {(citation.name || typeof citation.score === "number") && (
            <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
              {citation.name && (
                <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.2 text-zinc-300 font-medium">
                  {citation.name}
                </span>
              )}
              {typeof citation.score === "number" && (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  {(citation.score * 100).toFixed(0)}% match
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] text-ink-muted hover:bg-zinc-800 hover:text-white transition-colors"
          title="Preview code snippet"
        >
          <Code2 className="h-3 w-3" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center rounded p-1 text-ink-dim hover:text-white transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
