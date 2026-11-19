import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GitBranch,
  ExternalLink,
  Layers,
  FileCode,
  CheckSquare,
  Cpu,
  Info,
  Calendar,
  Database,
} from "lucide-react";
import CodeBlock from "./CodeBlock.jsx";

function formatNumber(n) {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const DEFAULT_CHECKLIST = [
  { id: "clone", label: "Clone repo & verify default branch", done: true },
  { id: "deps", label: "Install package dependencies (npm / pip)", done: false },
  { id: "env", label: "Configure local environment (.env file)", done: false },
  { id: "entry", label: "Inspect main bootstrapping file", done: false },
  { id: "tests", label: "Run test suite & verify assertions", done: false },
  { id: "arch", label: "Review core architecture & data models", done: false },
];

export default function ArchitectureView({ repo, onPreviewCitation }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "checklist" | "meta"
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);

  if (!repo) return null;

  const langs = repo.stats?.languages || {};
  const langEntries =
    langs instanceof Map ? Array.from(langs.entries()) : Object.entries(langs);

  const totalLangFiles = langEntries.reduce((acc, [, c]) => acc + c, 0) || 1;

  function toggleCheck(id) {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  }

  const githubUrl = repo.repoUrl || `https://github.com/${repo.owner}/${repo.name}`;

  return (
    <aside className="panel flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-rule/70 bg-bg-surface/90 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow flex items-center gap-1.5 text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Repository Architecture
          </span>

          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-mono text-[11px] text-ink-muted hover:text-accent transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="h-3 w-3" />
            <span>GitHub</span>
          </a>
        </div>

        <h2 className="mt-2 text-xl font-bold tracking-tight text-ink flex items-baseline gap-1 truncate">
          <span className="text-ink-muted font-normal">{repo.owner}</span>
          <span className="text-ink-faint">/</span>
          <span className="text-accent-soft">{repo.name}</span>
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-muted">
          <span className="flex items-center gap-1 rounded bg-bg-sub px-2 py-0.5 border border-ruleSoft">
            <GitBranch className="h-3 w-3 text-accent" />
            <span>{repo.defaultBranch || "main"}</span>
          </span>
          {repo.lastIndexedAt && (
            <span className="flex items-center gap-1 text-ink-dim">
              <Calendar className="h-3 w-3" />
              {new Date(repo.lastIndexedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 border-b border-rule/70 bg-bg-sub/50 p-4 font-mono">
        <StatCard label="Files" value={formatNumber(repo.stats?.files)} icon={FileCode} />
        <StatCard label="AST Chunks" value={formatNumber(repo.stats?.chunks)} icon={Cpu} highlight />
        <StatCard label="Lines of Code" value={formatNumber(repo.stats?.lines)} icon={Layers} />
      </div>

      {/* Language Distribution Bar */}
      {langEntries.length > 0 && (
        <div className="border-b border-rule/70 bg-bg-surface px-6 py-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-ink-dim mb-1.5">
            <span>Language Composition</span>
            <span>{langEntries.length} detected</span>
          </div>

          {/* Color Stacked Bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-bg-deep mb-2.5">
            {langEntries.map(([lang, count], idx) => {
              const pct = (count / totalLangFiles) * 100;
              const colors = [
                "bg-accent",
                "bg-brand-purple",
                "bg-brand-emerald",
                "bg-warning",
                "bg-bad",
              ];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={lang}
                  style={{ width: `${pct}%` }}
                  className={`${color} transition-all duration-300`}
                  title={`${lang}: ${count} files (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {langEntries.map(([lang, count]) => (
              <span key={lang} className="tag text-[10px]">
                <span className="font-semibold text-ink">{lang}</span>
                <span className="text-ink-faint">·</span>
                <span className="text-ink-muted">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-rule/70 bg-bg-sub/70 px-4 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-medium transition-colors ${
            activeTab === "overview"
              ? "border-accent text-accent"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-medium transition-colors ${
            activeTab === "checklist"
              ? "border-accent text-accent"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Onboarding Checklist</span>
          <span className="ml-1 rounded-full bg-bg-deep px-1.5 py-0.2 text-[10px] text-ink-dim">
            {checklist.filter((i) => i.done).length}/{checklist.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meta")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-medium transition-colors ${
            activeTab === "meta"
              ? "border-accent text-accent"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <Info className="h-3.5 w-3.5" />
          <span>Index Specs</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "overview" && (
          <div>
            {repo.architectureSummary ? (
              <div className="markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ code: CodeBlock }}
                >
                  {repo.architectureSummary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-ink-dim">
                <Info className="h-8 w-8 mb-2 text-ink-faint" />
                <p>No architecture overview generated for this repository.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "checklist" && (
          <div className="space-y-3">
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
                Day 1 Developer Walkthrough
              </h4>
              <p className="text-xs text-ink-muted mt-1">
                Track your local onboarding progress for this repository.
              </p>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${
                    item.done
                      ? "border-good/40 bg-good/5 text-ink"
                      : "border-rule/70 bg-bg-sub/80 text-ink-muted hover:border-rule hover:text-ink"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-rule text-accent focus:ring-accent bg-bg-deep cursor-pointer"
                  />
                  <span className={`text-xs font-medium ${item.done ? "line-through text-ink-dim" : ""}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-ruleSoft bg-bg-deep/60 p-4 font-mono text-[11px] text-ink-dim">
              💡 Need help with any step? Ask the assistant in the chat on the right!
            </div>
          </div>
        )}

        {activeTab === "meta" && (
          <div className="space-y-4 font-mono text-xs">
            <div className="rounded-xl border border-rule/70 bg-bg-sub/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-ruleSoft pb-2">
                <span className="text-ink-dim">Vector Engine:</span>
                <span className="text-ink flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-accent" /> Qdrant
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-ruleSoft pb-2">
                <span className="text-ink-dim">Embedding Model:</span>
                <span className="text-accent-soft">text-embedding-3-small (1536-dim)</span>
              </div>
              <div className="flex items-center justify-between border-b border-ruleSoft pb-2">
                <span className="text-ink-dim">Chunking Strategy:</span>
                <span className="text-good font-semibold">Tree-sitter AST Slicing</span>
              </div>
              <div className="flex items-center justify-between border-b border-ruleSoft pb-2">
                <span className="text-ink-dim">Retrieval Layer:</span>
                <span className="text-ink">Cosine Hybrid + Payload Filter</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-dim">Index Status:</span>
                <span className="rounded bg-good/15 px-2 py-0.5 text-good font-semibold">
                  {repo.status || "ready"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function StatCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${
      highlight ? "border-accent/40 bg-accent/5" : "border-rule/60 bg-bg-surface/60"
    }`}>
      <div className="flex items-center justify-center gap-1 text-ink-dim mb-1">
        <Icon className={`h-3.5 w-3.5 ${highlight ? "text-accent" : ""}`} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-lg font-bold tabular-nums ${highlight ? "text-accent" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
