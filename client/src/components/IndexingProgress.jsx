import { useEffect, useState } from "react";
import { GitBranch, Terminal, Cpu, Database, CheckCircle2, Loader2, Sparkles } from "lucide-react";

const PIPELINE_STEPS = [
  {
    id: "meta",
    label: "GitHub Pre-flight Check",
    desc: "Verifying repository accessibility, permissions & branch",
    icon: GitBranch,
    estimatedMs: 1800,
  },
  {
    id: "clone",
    label: "Shallow Clone & Tree Scan",
    desc: "Fetching repo snapshot and discovering supported source files",
    icon: Terminal,
    estimatedMs: 3500,
  },
  {
    id: "chunk",
    label: "AST Tree-sitter Parsing",
    desc: "Splitting code on function, class & method boundaries",
    icon: Cpu,
    estimatedMs: 4000,
  },
  {
    id: "embed",
    label: "Vector Embedding & Qdrant Index",
    desc: "Generating 1536-dim embeddings and payload symbol indexes",
    icon: Database,
    estimatedMs: 6000,
  },
  {
    id: "summary",
    label: "Architecture Synthesis",
    desc: "Distilling core modules, request flows & system patterns",
    icon: Sparkles,
    estimatedMs: 4500,
  },
];

export default function IndexingProgress({ repoUrl }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    let timer;
    if (currentStepIdx < PIPELINE_STEPS.length - 1) {
      const ms = PIPELINE_STEPS[currentStepIdx].estimatedMs;
      timer = setTimeout(() => {
        setCurrentStepIdx((prev) => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
      }, ms);
    }
    return () => clearTimeout(timer);
  }, [currentStepIdx]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIdx + 0.6) / PIPELINE_STEPS.length) * 100)
  );

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-rule bg-bg-surface p-6 shadow-card sm:p-8">
      {/* Subtle top ambient highlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 font-mono text-xs font-semibold text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-zinc-400 animate-ping" />
              AST-Aware Ingestion Pipeline Active
            </div>
            <h3 className="mt-2 text-lg font-semibold text-ink">
              Analyzing Codebase
            </h3>
            <p className="font-mono text-xs text-ink-muted truncate max-w-lg mt-0.5">
              {repoUrl}
            </p>
          </div>

          <div className="text-right">
            <span className="font-mono text-2xl font-bold text-white">
              {progressPercent}%
            </span>
            <p className="font-mono text-[11px] text-ink-dim uppercase tracking-wider">
              Pipeline Progress
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-deep mb-8">
          <div
            className="h-full bg-gradient-to-r from-zinc-400 via-white to-zinc-300 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-all duration-300 ${
                  isCurrent
                    ? "border-zinc-500 bg-zinc-800/40 shadow-sm"
                    : isCompleted
                    ? "border-rule/80 bg-bg-sub/60 opacity-90"
                    : "border-ruleSoft bg-transparent opacity-40"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    isCurrent
                      ? "border-zinc-400 bg-zinc-800 text-white animate-pulse"
                      : isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-ruleSoft bg-bg-deep text-ink-dim"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink">
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300 font-medium">
                        Processing...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Callout */}
        <div className="mt-6 rounded-xl border border-ruleSoft bg-bg-sub/40 p-4 font-mono text-[11px] text-ink-dim flex items-center justify-between">
          <span>
            ⚡ Tip: Tree-sitter isolates whole functions and classes so embeddings preserve syntactic context.
          </span>
          <span className="hidden sm:inline text-ink-faint">
            Cached repos reload instantly
          </span>
        </div>
      </div>
    </div>
  );
}

