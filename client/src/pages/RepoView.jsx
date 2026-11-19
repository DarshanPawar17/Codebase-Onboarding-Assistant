import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, RotateCw } from "lucide-react";

import ChatBox from "../components/ChatBox.jsx";
import ArchitectureView from "../components/ArchitectureView.jsx";
import CodeModal from "../components/CodeModal.jsx";
import IndexingProgress from "../components/IndexingProgress.jsx";
import { getRepo, analyzeRepo } from "../api/client.js";

export default function RepoView() {
  const { repoId } = useParams();
  const [repo, setRepo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRepo() {
      try {
        const r = await getRepo(repoId);
        if (cancelled) return;
        setRepo(r);
        setLoading(false);

        // If repo is currently being indexed in the background, poll every 2.5 seconds
        if (r.status === "indexing" || r.status === "pending") {
          pollTimerRef.current = setTimeout(fetchRepo, 2500);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.error || err.message || "Failed to load repo."
          );
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setError("");
    fetchRepo();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [repoId]);

  async function handleRetry() {
    if (!repo?.repoUrl || retrying) return;
    setRetrying(true);
    setError("");
    try {
      const updated = await analyzeRepo(repo.repoUrl, { force: true });
      setRepo(updated);
      // Restart polling
      if (updated.status === "indexing" || updated.status === "pending") {
        pollTimerRef.current = setTimeout(async function poll() {
          try {
            const r = await getRepo(repoId);
            setRepo(r);
            if (r.status === "indexing" || r.status === "pending") {
              pollTimerRef.current = setTimeout(poll, 2500);
            }
          } catch {
            // ignore poll errors
          }
        }, 2500);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "Failed to restart indexing."
      );
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="font-mono text-xs text-ink-muted">
          Connecting to repository architecture & vector indexes...
        </p>
      </div>
    );
  }

  // Repository failed during indexing
  if (repo && repo.status === "failed") {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Link to="/" className="btn-ghost mb-6 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="rounded-2xl border border-bad/40 bg-bad/5 p-6 text-bad shadow-lg">
          <div className="flex items-center gap-2 mb-2 font-semibold text-base">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Indexing Could Not Complete</span>
          </div>
          <p className="text-xs sm:text-sm text-bad/90 font-mono mt-2 leading-relaxed">
            {repo.error || "The repository could not be indexed."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="btn-primary"
            >
              <RotateCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
              <span>{retrying ? "Retrying..." : "Retry Indexing"}</span>
            </button>
            <Link to="/" className="btn-ghost">
              Try Another Repo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Repository is currently indexing in the background
  if (repo && (repo.status === "indexing" || repo.status === "pending")) {
    return (
      <div className="mx-auto max-w-3xl py-6 sm:py-10">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="btn-ghost inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </Link>
          <span className="font-mono text-xs text-accent animate-pulse">
            ● Indexing in progress...
          </span>
        </div>
        <IndexingProgress repoUrl={repo.repoUrl || `${repo.owner}/${repo.name}`} />
      </div>
    );
  }

  // Load error
  if (error || !repo) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Link to="/" className="btn-ghost mb-6 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="rounded-2xl border border-bad/40 bg-bad/5 p-6 text-bad shadow-lg">
          <div className="flex items-center gap-2 mb-2 font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <span>Repository Error</span>
          </div>
          <p className="text-sm opacity-90">{error || "Repository not found."}</p>
        </div>
      </div>
    );
  }

  // Repo is ready! Render the full workspace
  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-3">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border border-rule/80 bg-bg-surface/80 px-3 py-1.5 text-xs font-mono text-ink-muted hover:border-accent hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>New Repo</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-ink-dim">
            <span>repos</span>
            <span>/</span>
            <span className="text-ink font-semibold">{repo.owner}</span>
            <span>/</span>
            <span className="text-accent-soft font-semibold">{repo.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-2.5 py-0.5 font-mono text-[11px] text-good font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
            {repo.status || "ready"}
          </span>
        </div>
      </div>

      {/* Main Workspace Split View */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:overflow-hidden">
        {/* Left Column: Architecture & Onboarding View */}
        <div className="min-h-0 lg:col-span-5 xl:col-span-4 h-full">
          <ArchitectureView
            repo={repo}
            onPreviewCitation={(c) => setSelectedCitation(c)}
          />
        </div>

        {/* Right Column: Grounded Chat Assistant */}
        <div className="min-h-0 lg:col-span-7 xl:col-span-8 h-full">
          <ChatBox
            repoId={repo.id || repo._id}
            onPreviewCitation={(c) => setSelectedCitation(c)}
          />
        </div>
      </div>

      {/* Code Inspection Modal */}
      {selectedCitation && (
        <CodeModal
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  );
}
