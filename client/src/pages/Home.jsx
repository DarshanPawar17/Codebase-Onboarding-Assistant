import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RepoInput from "../components/RepoInput.jsx";
import { analyzeRepo } from "../api/client.js";

const RECENT_KEY = "coa_recent_repos";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentRepos, setRecentRepos] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentRepos(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  function saveRecentRepo(repo) {
    try {
      const entry = {
        id: repo.id || repo._id,
        owner: repo.owner,
        name: repo.name,
        repoUrl: repo.repoUrl,
        timestamp: Date.now(),
      };
      setRecentRepos((prev) => {
        const filtered = prev.filter((r) => r.repoUrl !== repo.repoUrl);
        const updated = [entry, ...filtered].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore storage write errors
    }
  }

  async function handleAnalyze(url) {
    setError("");
    setLoading(true);
    try {
      const repo = await analyzeRepo(url);
      saveRecentRepo(repo);
      navigate(`/repo/${repo.id || repo._id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to analyze repo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-4 sm:py-8">
      <RepoInput
        onSubmit={handleAnalyze}
        loading={loading}
        error={error}
        recentRepos={recentRepos}
      />
    </div>
  );
}
