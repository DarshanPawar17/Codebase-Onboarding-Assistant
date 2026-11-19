import { Link, Outlet } from "react-router-dom";
import { Terminal, Sparkles, Layers, Cpu } from "lucide-react";
import GithubIcon from "./components/GithubIcon.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-rule bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-bg-soft text-ink transition-transform group-hover:border-zinc-500">
              <Terminal className="h-4 w-4 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-ink text-sm sm:text-base tracking-tight">
                  Codebase<span className="text-zinc-400 font-normal">Assistant</span>
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-zinc-800/80 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-300">
                  AST-RAG
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-ink-dim font-mono leading-none mt-0.5">
                Intelligent Onboarding for Any GitHub Codebase
              </p>
            </div>
          </Link>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-rule bg-bg-sub/80 px-3 py-1 font-mono text-[11px] text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
              <span>Tree-sitter AST · Vector Engine</span>
            </div>

            <a
              href="https://github.com/DarshanPawar17"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-rule bg-bg-surface px-3 py-1.5 text-xs font-mono text-ink-muted hover:border-zinc-500 hover:text-ink transition-colors"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Modern Minimal Footer */}
      <footer className="border-t border-rule bg-bg-deep/90 py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 font-mono text-[11px] text-ink-dim">
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="text-ink-muted">Tree-sitter</span>
            <span>·</span>
            <span className="text-ink-muted">Vector Search</span>
            <span>·</span>
            <span className="text-ink-muted">React + Vite</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-faint">Engineered by Darshan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
