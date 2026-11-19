const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true, index: true },
    content: { type: String, required: true },
    vector: { type: [Number], required: true },
    metadata: {
      filePath: { type: String, required: true, index: true },
      startLine: { type: Number },
      endLine: { type: Number },
      type: { type: String },
      name: { type: String, index: true },
      language: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index for fast collection lookups
ChunkSchema.index({ collectionName: 1, "metadata.name": 1 });

module.exports = mongoose.model("Chunk", ChunkSchema);
