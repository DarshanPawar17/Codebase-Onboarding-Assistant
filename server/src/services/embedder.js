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
        // If the provider specifies a retry delay (e.g. Gemini rate limits), honor it and retry!
        const match = err.message && err.message.match(/retry in ([\d.]+)s/i);
        if (err.status === 429 && match && retries > 0) {
          // Add a 2.5s safety buffer to ensure the provider's rate-limit window has genuinely cleared
          const waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 2500;
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
          throw new Error(
            "AI provider credit balance exhausted. Please check your API billing or configure free Gemini."
          );
        }

        if (err.status === 429 && retries > 0) {
          const waitTime = 12000;
          logger.warn(
            `Rate limit hit! Waiting ${(waitTime / 1000).toFixed(1)}s before retrying (${retries} retries left)...`
          );
          await delay(waitTime);
          retries--;
        } else {
          throw err;
        }
      }
    }
  }

  return { vectors: results, usedTokens };
}

async function embedSingle(text) {
  const { vectors } = await embedTexts([text]);
  return vectors[0];
}

module.exports = { embedTexts, embedSingle, EMBED_DIM };
