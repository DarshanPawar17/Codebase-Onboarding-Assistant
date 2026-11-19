const Repo = require("../models/Repo");
const logger = require("../utils/logger");
const env = require("../config/env");

const github = require("./github");
const chunker = require("./chunker");
const embedder = require("./embedder");
const vectorStore = require("./vectorStore");
const llm = require("./llm");

// Track active background indexing jobs to prevent duplicate concurrent runs
const inFlightIndexing = new Set();

// Decide whether we can reuse an existing index for this repo.
function isCacheFresh(repo) {
  if (!repo || repo.status !== "ready" || !repo.lastIndexedAt) return false;
  const ageMs = Date.now() - new Date(repo.lastIndexedAt).getTime();
  const maxAgeMs = env.limits.cacheReindexHours * 60 * 60 * 1000;
  return ageMs < maxAgeMs;
}

// Background indexing pipeline
async function runIndexingPipeline({ repoId, normalizedUrl, owner, name }) {
  if (inFlightIndexing.has(normalizedUrl)) {
    logger.info(`Indexing already in flight for ${normalizedUrl}`);
    return;
  }
  inFlightIndexing.add(normalizedUrl);

  const collectionName = vectorStore.collectionNameFor(normalizedUrl);
  let clonePath;

  try {
    logger.info(`[Background Indexer] Starting shallow clone for ${normalizedUrl}`);
    const cloneResult = await github.cloneRepo({
      owner,
      name,
      normalizedUrl,
    });
    clonePath = cloneResult.localPath;

    const repo = await Repo.findById(repoId);
    if (!repo) throw new Error("Repo record not found in database");

    repo.commitSha = cloneResult.commitSha;
    if (cloneResult.defaultBranch) {
      repo.defaultBranch = cloneResult.defaultBranch;
    }

    // AST chunking with smart filtering and capping
    logger.info(`[Background Indexer] Chunking ${normalizedUrl}...`);
    const { chunks, stats } = await chunker.chunkRepository({ repoRoot: clonePath });
    if (chunks.length === 0) {
      throw new Error(
        "No supported source files found. Supports JavaScript, TypeScript, and Python."
      );
    }
    logger.info(
      `[Background Indexer] Produced ${chunks.length} selected chunks across ${stats.files} files`
    );

    // Vector embedding
    logger.info(`[Background Indexer] Generating embeddings for ${chunks.length} chunks...`);
    const { vectors, usedTokens } = await embedder.embedTexts(
      chunks.map((c) => c.content)
    );

    // Qdrant upsert
    logger.info(`[Background Indexer] Upserting vectors into Qdrant (${collectionName})...`);
    await vectorStore.dropCollection(collectionName);
    await vectorStore.ensureCollection(collectionName);
    await vectorStore.upsertChunks({ collectionName, chunks, vectors });

    // Architecture overview synthesis
    const sample = chunks.slice(0, 12).map((c) => ({
      content: c.content,
      payload: c.metadata,
    }));
    let summary = "";
    try {
      summary = await llm.generateArchitectureSummary({
        repoName: `${owner}/${name}`,
        topChunks: sample,
      });
    } catch (err) {
      logger.warn(`Architecture summary failed (non-fatal): ${err.message}`);
    }

    repo.stats = {
      files: stats.files,
      lines: stats.lines,
      chunks: chunks.length,
      embedTokens: usedTokens || 0,
      languages: stats.languages,
    };
    repo.architectureSummary = summary;
    repo.status = "ready";
    repo.error = null;
    repo.lastIndexedAt = new Date();
    await repo.save();

    logger.info(`[Background Indexer] Successfully completed indexing for ${normalizedUrl}`);
  } catch (err) {
    logger.error(`[Background Indexer] Failed for ${normalizedUrl}: ${err.message}`);
    await Repo.findByIdAndUpdate(repoId, {
      status: "failed",
      error: err.message || "Failed to index repository.",
    }).catch(() => {});
  } finally {
    inFlightIndexing.delete(normalizedUrl);
    if (clonePath) {
      await github.cleanupClone(clonePath).catch(() => {});
    }
  }
}

// End-to-end entrypoint: creates/updates repo record and kicks off indexing.
// Defaults to non-blocking async execution (returns in <400ms).
async function indexRepo({ repoUrl, force = false, wait = false }) {
  const { owner, name, normalizedUrl } = github.parseGithubUrl(repoUrl);

  let repo = await Repo.findOne({ repoUrl: normalizedUrl });
  if (!force && isCacheFresh(repo)) {
    logger.info(`Cache hit for ${normalizedUrl} (indexed ${repo.lastIndexedAt})`);
    return repo;
  }

  // Pre-flight: verify repo exists, public, and within size limit (<50MB)
  const meta = await github.fetchRepoMetadata(owner, name, normalizedUrl);
  if (meta.isPrivate) {
    throw new Error("Private repos are not supported in MVP.");
  }

  if (meta.sizeKB && meta.sizeKB > 50_000) {
    throw new Error(
      `Repo is too large (${(meta.sizeKB / 1024).toFixed(1)} MB). MVP supports smaller repos.`
    );
  }

  const collectionName = vectorStore.collectionNameFor(normalizedUrl);

  if (!repo) {
    repo = await Repo.create({
      repoUrl: normalizedUrl,
      owner,
      name,
      defaultBranch: meta.defaultBranch || "main",
      collectionName,
      status: "indexing",
      error: null,
    });
  } else {
    repo.status = "indexing";
    repo.error = null;
    repo.defaultBranch = meta.defaultBranch || repo.defaultBranch || "main";
    repo.collectionName = collectionName;
    await repo.save();
  }

  // Launch background pipeline
  const pipeline = runIndexingPipeline({
    repoId: repo._id,
    normalizedUrl,
    owner,
    name,
    meta,
  });

  if (wait) {
    await pipeline;
    return await Repo.findById(repo._id);
  }

  return repo;
}

module.exports = { indexRepo, isCacheFresh };
