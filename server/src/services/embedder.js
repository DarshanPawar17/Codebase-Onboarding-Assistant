const OpenAI = require("openai");
const env = require("../config/env");
const logger = require("../utils/logger");

let _client = null;
function client() {
  if (!_client) {
    if (!env.openai.apiKey) {
      throw new Error("OPENAI_API_KEY is not set. Add it to server/.env.");
    }
    _client = new OpenAI({
      apiKey: env.openai.apiKey,
      baseURL: env.openai.baseURL,
    });
  }
  return _client;
}

// Vector dim depends on which embedding model is in use.
// Configured in env so the Qdrant collection size always matches.
const EMBED_DIM = env.openai.embedDim;

// OpenAI's embeddings endpoint accepts an array of inputs. We batch to keep
// each request bounded and to amortize latency.
async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const batchSize = env.limits.embedBatchSize;
  const results = new Array(texts.length);
  let usedTokens = 0;

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // Determine if using Gemini via OpenAI-compatible endpoint
  const isGemini = (env.openai.baseURL || "").includes("generativelanguage.googleapis.com");
  const interBatchDelay = isGemini ? 1200 : 300;

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    logger.debug(
      `Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${slice.length} items)`
    );
    
    if (i > 0) {
      await delay(interBatchDelay);
    }

    let success = false;
    let retries = 6;
    while (!success && retries > 0) {
      try {
        const resp = await client().embeddings.create({
          model: env.openai.embedModel,
          input: slice,
        });
        for (let j = 0; j < resp.data.length; j++) {
          results[i + j] = resp.data[j].embedding;
        }
        if (resp.usage && resp.usage.total_tokens) {
          usedTokens += resp.usage.total_tokens;
        }
        success = true;
      } catch (err) {
        // Check for daily quota exhaustion (e.g. 1000/day limit on Gemini free tier)
        const isDailyQuota =
          err.status === 429 &&
          (err.message.includes("per day") ||
            err.message.includes("quota") ||
            err.message.includes("Quota exceeded"));

        if (isDailyQuota) {
          logger.warn(
            `Embedding API quota reached (${err.message.slice(0, 100)}...). Proceeding with AST symbol & full-text indexing.`
          );
          // Return whatever vectors we managed to get so far without failing
          return { vectors: results.filter(Boolean), usedTokens, quotaExceeded: true };
        }

        // If the provider specifies a short per-minute retry delay, honor it
        const match = err.message && err.message.match(/retry in ([\d.]+)s/i);
        if (err.status === 429 && match && retries > 1) {
          const waitSeconds = parseFloat(match[1]);
          if (waitSeconds > 15) {
            logger.warn(
              `Embedding rate limit wait too long (${waitSeconds}s). Falling back to AST symbol indexing.`
            );
            return { vectors: results.filter(Boolean), usedTokens, quotaExceeded: true };
          }
          const waitTime = Math.ceil(waitSeconds * 1000) + 1500;
          logger.warn(
            `Rate limit hit! Waiting ${(waitTime / 1000).toFixed(1)}s before retrying (${retries} retries left)...`
          );
          await delay(waitTime);
          retries--;
          continue;
        }

        if (
          err.code === "credit_balance_exhausted" ||
          (err.message && err.message.includes("credit_balance_exhausted")) ||
          (err.message && err.message.includes("no credits remaining"))
        ) {
          logger.warn(
            "Embedding API credit balance exhausted. Falling back to AST symbol indexing."
          );
          return { vectors: results.filter(Boolean), usedTokens, quotaExceeded: true };
        }

        if (err.status === 429 && retries > 1) {
          const waitTime = 5000;
          await delay(waitTime);
          retries--;
        } else {
          logger.warn(`Embedding batch failed (${err.message}); continuing with AST symbol indexing.`);
          return { vectors: results.filter(Boolean), usedTokens, quotaExceeded: true };
        }
      }
    }
  }

  return { vectors: results, usedTokens };
}

async function embedSingle(text) {
  try {
    const { vectors } = await embedTexts([text]);
    return vectors[0] || null;
  } catch (err) {
    logger.warn(`embedSingle skipped: ${err.message}`);
    return null;
  }
}

module.exports = { embedTexts, embedSingle, EMBED_DIM };
