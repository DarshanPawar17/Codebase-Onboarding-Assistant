import { useState } from "react";
import {
  Search,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  FileCheck2,
  Clock,
  ExternalLink,
  Zap,
  ShieldAlert,
} from "lucide-react";
import GithubIcon from "./GithubIcon.jsx";
import IndexingProgress from "./IndexingProgress.jsx";

const FEATURED_REPOS = [
  {
    owner: "expressjs",
    name: "express",
    lang: "JavaScript",
    desc: "Fast, unopinionated, minimalist web framework for Node.js",
    url: "https://github.com/expressjs/express",
    stats: "142 files · Web Server",
  },
  {
    owner: "pmndrs",
    name: "zustand",
    lang: "TypeScript",
    desc: "Bear necessities for state management in React without boilerplate",
    url: "https://github.com/pmndrs/zustand",
    stats: "35 files · State Store",
  },
  {
    owner: "tj",
    name: "commander.js",
    lang: "JavaScript",
    desc: "The complete solution for node.js command-line interfaces",
    url: "https://github.com/tj/commander.js",
    stats: "24 files · CLI Engine",
  },
];

export default function RepoInput({ onSubmit, loading, error, recentRepos = [] }) {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    setSubmittedUrl(trimmed);
    onSubmit?.(trimmed);
  }

  function handleSelectRepo(selectedUrl) {
    setUrl(selectedUrl);
    setSubmittedUrl(selectedUrl);
    onSubmit?.(selectedUrl);
  }

  return (
    <section className="mx-auto max-w-4xl py-4 sm:py-8">
      {/* Hero Banner */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg-surface px-3.5 py-1 text-xs font-mono font-medium text-ink-muted mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
          <span>AST-Aware RAG Engine for Any GitHub Repository</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink">
          Understand any codebase{" "}
          <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            like a seasoned colleague
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-ink-muted leading-relaxed">
          Drop any public GitHub repository URL. Tree-sitter splits the code along real function and class AST boundaries, stores vector indexes, and gives you instant grounded answers with line-level GitHub citations.
        </p>
      </div>

      {/* Main Input Form */}
      <div className="mt-10">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl border border-rule bg-bg-surface/90 p-2 shadow-card backdrop-blur-md focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600 transition-all duration-200">
            <div className="flex flex-1 items-center gap-3 px-3 py-2">
              <GithubIcon className="h-5 w-5 text-ink-muted shrink-0" />
              <input
                id="repo-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={loading}
                autoFocus
                className="w-full bg-transparent font-mono text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary mt-2 sm:mt-0 px-6 py-3 text-xs"
            >
              <Zap className="h-4 w-4" />
              <span>{loading ? "Analyzing..." : "Analyze Codebase"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-xs text-bad">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Live Indexing Pipeline Stepper */}
        {loading && <IndexingProgress repoUrl={submittedUrl || url} />}
      </div>

      {/* Featured Instant Demos */}
      {!loading && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
              <span>Try Instant Pre-Indexed Repositories</span>
            </div>
            <span className="font-mono text-[11px] text-ink-dim hidden sm:inline">
              1-click instant load
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {FEATURED_REPOS.map((ex) => (
              <button
                key={ex.name}
                type="button"
                onClick={() => handleSelectRepo(ex.url)}
                className="glass-card flex flex-col justify-between p-4 text-left group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-ink group-hover:text-white transition-colors">
                      {ex.owner}/{ex.name}
                    </span>
                    <span className="rounded bg-bg-deep px-2 py-0.5 font-mono text-[10px] text-ink-dim border border-ruleSoft">
                      {ex.lang}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                    {ex.desc}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ruleSoft pt-2 font-mono text-[11px] text-ink-dim">
                  <span>{ex.stats}</span>
                  <span className="flex items-center gap-1 text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                    Load <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Repositories (if any exist) */}
      {!loading && recentRepos.length > 0 && (
        <div className="mt-8 border-t border-ruleSoft pt-6">
          <div className="flex items-center gap-2 font-mono text-xs text-ink-dim mb-3">
            <Clock className="h-3.5 w-3.5" />
            <span>Recently Explored</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentRepos.slice(0, 5).map((r) => (
              <button
                key={r.id || r.repoUrl}
                type="button"
                onClick={() => handleSelectRepo(r.repoUrl)}
                className="flex items-center gap-2 rounded-lg border border-rule bg-bg-surface px-3 py-1.5 font-mono text-xs text-ink-muted hover:border-zinc-500 hover:text-ink transition-colors"
              >
                <span>{r.owner}/{r.name}</span>
                <ArrowRight className="h-3 w-3 text-ink-dim" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Architecture Highlights Section */}
      {!loading && (
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-rule bg-bg-surface/80 p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 mb-3.5 border border-zinc-700/50">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-semibold text-ink text-sm">
              01 · AST-Aware Chunking
            </h3>
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              Tree-sitter parses JavaScript, TypeScript, and Python along syntactic function and class boundaries. Chunks are self-contained semantic units rather than arbitrary character slices.
            </p>
          </div>

          <div className="rounded-2xl border border-rule bg-bg-surface/80 p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 mb-3.5 border border-zinc-700/50">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-semibold text-ink text-sm">
              02 · Hybrid Retrieval
            </h3>
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              Combines dense vector cosine search with exact symbol and payload filters. Asking "Where is <code className="rounded bg-bg-deep px-1.5 py-0.5 border border-rule font-mono text-zinc-200">parseAsync</code> defined?" hits the exact symbol.
            </p>
          </div>

          <div className="rounded-2xl border border-rule bg-bg-surface/80 p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 mb-3.5 border border-zinc-700/50">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-semibold text-ink text-sm">
              03 · Grounded Line Citations
            </h3>
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              Zero hallucination. Every generated answer cites the exact line range on GitHub, and you can inspect the retrieved code snippet right inside the app with syntax highlighting.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
