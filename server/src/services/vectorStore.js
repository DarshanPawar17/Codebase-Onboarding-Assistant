const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");

const env = require("../config/env");
const logger = require("../utils/logger");
const Chunk = require("../models/Chunk");
const { EMBED_DIM } = require("./embedder");

let _client = null;
function client() {
  if (!_client) {
    _client = new QdrantClient({
      url: env.qdrant.url,
      apiKey: env.qdrant.apiKey,
      checkCompatibility: false,
    });
  }
  return _client;
}

// Each repo gets its own collection so we can drop it cleanly on re-index.
function collectionNameFor(repoUrl) {
  const safe = repoUrl
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .toLowerCase()
    .slice(0, 60);
  return `repo_${safe}`;
}

// Fast cosine similarity between two float vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function ensureCollection(name) {
  try {
    const existing = await client().collectionExists(name);
    if (!existing || !existing.exists) {
      await client().createCollection(name, {
        vectors: { size: EMBED_DIM, distance: "Cosine" },
      });
      try {
        await client().createPayloadIndex(name, {
          field_name: "filePath",
          field_schema: "keyword",
        });
        await client().createPayloadIndex(name, {
          field_name: "name",
          field_schema: "keyword",
        });
        await client().createPayloadIndex(name, {
          field_name: "language",
          field_schema: "keyword",
        });
      } catch {
        // payload indexes non-fatal
      }
    }
  } catch (err) {
    logger.warn(
      `Qdrant ensureCollection skipped (${err.message}); using built-in MongoDB vector store.`
    );
  }
}

async function dropCollection(name) {
  try {
    await Chunk.deleteMany({ collectionName: name });
  } catch (err) {
    logger.warn(`Failed to drop MongoDB chunks for ${name}: ${err.message}`);
  }

  try {
    await client().deleteCollection(name);
    logger.info(`Dropped Qdrant collection: ${name}`);
  } catch {
    // Qdrant drop non-fatal
  }
}

// chunks: [{ content, metadata }], vectors: [[...]]
async function upsertChunks({ collectionName, chunks, vectors }) {
  if (chunks.length !== vectors.length) {
    throw new Error("Chunks and vectors length mismatch");
  }
  if (chunks.length === 0) return;

  // 1. Always persist to MongoDB (reliable primary vector storage)
  try {
    await Chunk.deleteMany({ collectionName });
    const docs = chunks.map((chunk, i) => ({
      collectionName,
      content: chunk.content,
      vector: vectors[i],
      metadata: chunk.metadata,
    }));
    await Chunk.insertMany(docs);
    logger.info(`Persisted ${docs.length} chunks into MongoDB for ${collectionName}`);
  } catch (err) {
    logger.error(`MongoDB chunk upsert failed: ${err.message}`);
    throw err;
  }

  // 2. Best-effort sync to Qdrant (will not throw or fail the indexing if Qdrant is down)
  try {
    const points = chunks.map((chunk, i) => ({
      id: uuidv4(),
      vector: vectors[i],
      payload: {
        content: chunk.content,
        ...chunk.metadata,
      },
    }));

    const PAGE = 128;
    for (let i = 0; i < points.length; i += PAGE) {
      const slice = points.slice(i, i + PAGE);
      await client().upsert(collectionName, { points: slice, wait: true });
    }
    logger.info(`Upserted ${points.length} chunks into Qdrant (${collectionName})`);
  } catch (err) {
    logger.warn(
      `Qdrant upsert skipped (${err.message}); built-in MongoDB vector store active.`
    );
  }
}

// Hybrid search over MongoDB chunks: exact symbol matches + in-memory cosine similarity
async function searchMongo({ collectionName, vector, keyword, topK = 8 }) {
  const chunks = await Chunk.find({ collectionName }).lean();
  if (chunks.length === 0) return [];

  let keywordHits = [];
  if (keyword) {
    const kwLower = keyword.toLowerCase();
    keywordHits = chunks
      .filter((c) => (c.metadata?.name || "").toLowerCase() === kwLower)
      .slice(0, 5)
      .map((c) => ({
        id: String(c._id),
        score: 1.0,
        payload: {
          content: c.content,
          ...c.metadata,
        },
      }));
  }

  // Cosine scoring over all chunks in collection (takes ~5-7ms)
  const vectorHits = chunks.map((c) => ({
    id: String(c._id),
    score: cosineSimilarity(c.vector, vector),
    payload: {
      content: c.content,
      ...c.metadata,
    },
  }));

  // Merge exact matches first, then best cosine hits
  const merged = new Map();
  for (const r of keywordHits) merged.set(r.id, r);
  for (const r of vectorHits) if (!merged.has(r.id)) merged.set(r.id, r);

  return Array.from(merged.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);
}

// Hybrid search: tries Qdrant first; falls back seamlessly to MongoDB
async function hybridSearch({ collectionName, vector, keyword, topK = 8 }) {
  try {
    const c = client();
    const vectorResults = await c.search(collectionName, {
      vector,
      limit: topK,
      with_payload: true,
    });

    let keywordResults = [];
    if (keyword) {
      try {
        const scrolled = await c.scroll(collectionName, {
          filter: {
            must: [{ key: "name", match: { value: keyword } }],
          },
          limit: 5,
          with_payload: true,
          with_vector: false,
        });
        keywordResults = (scrolled.points || []).map((p) => ({
          id: p.id,
          score: 1.0,
          payload: p.payload,
        }));
      } catch {
        // keyword filter non-fatal
      }
    }

    const merged = new Map();
    for (const r of keywordResults) merged.set(r.id, r);
    for (const r of vectorResults) if (!merged.has(r.id)) merged.set(r.id, r);

    const results = Array.from(merged.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);

    if (results.length > 0) return results;
  } catch (err) {
    logger.warn(`Qdrant search failed (${err.message}); using built-in MongoDB vector store.`);
  }

  return await searchMongo({ collectionName, vector, keyword, topK });
}

module.exports = {
  ensureCollection,
  dropCollection,
  upsertChunks,
  hybridSearch,
  collectionNameFor,
  searchMongo, // exposed for testing/fallback
};
