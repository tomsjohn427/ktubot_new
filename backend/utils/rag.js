const fs   = require('fs');
const path = require('path');
const axios = require('axios');

// ── Upload progress tracker (in-memory) ───────────────────────
const uploadJobs = new Map();

// ── PDF Text Extraction ────────────────────────────────────────
async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parse error:', err.message);
    throw new Error('Failed to extract text from PDF: ' + err.message);
  }
}

// ── Text Chunking ─────────────────────────────────────────────
function chunkText(text, chunkSize = 400, overlap = 40) {
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  if (!cleaned) return [];
  const words = cleaned.split(/\s+/);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 20) chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  return chunks;
}

// ── Ollama Embedding ──────────────────────────────────────────
async function generateEmbedding(text) {
  try {
    const response = await axios.post('http://localhost:11434/api/embeddings', {
      model: 'nomic-embed-text',
      prompt: text.slice(0, 8000),
    });
    return response.data.embedding;
  } catch (err) {
    console.error('Ollama Embedding error:', err.message);
    return [];
  }
}

async function generateEmbeddings(chunks, jobId) {
  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    results.push({ index: i, embedding });
    if (jobId) {
      uploadJobs.set(jobId, { total: chunks.length, completed: i + 1, status: 'processing' });
    }
  }
  return results;
}

// ── Cosine Similarity ─────────────────────────────────────────
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Keyword Fallback ──────────────────────────────────────────
function keywordRetrieve(query, chunks, topK = 5) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = chunks.map((chunk, i) => {
    const lower = chunk.text.toLowerCase();
    let score = 0;
    queryWords.forEach(w => {
      const count = (lower.match(new RegExp(w, 'g')) || []).length;
      score += count;
    });
    return { index: i, score, text: chunk.text };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.text);
}

// ── Semantic Retrieval ────────────────────────────────────────
async function retrieveRelevantChunks(query, noteChunks, topK = 5) {
  if (!noteChunks || noteChunks.length === 0) return [];
  const hasEmbeddings = noteChunks.some(c => c.embedding && c.embedding.length > 0);
  if (!hasEmbeddings) return keywordRetrieve(query, noteChunks, topK);
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding.length) return keywordRetrieve(query, noteChunks, topK);
  const scored = noteChunks.map(chunk => ({
    text:  chunk.text,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.text);
}

// ── Marks-Based Output Formatter ──────────────────────────────
// Pure output layer — does NOT touch the RAG system prompt.
// Appends a formatting instruction to the user question so the LLM
// knows how long/structured the answer should be.
function buildMarksInstruction(marksMode) {
  switch (marksMode) {
    case '3':
      return `\n\n[FORMAT: Answer for a 3-mark question. Provide exactly 3–4 concise key points. Use a numbered list. Total answer should be brief, around 60–80 words.]`;
    case '7':
      return `\n\n[FORMAT: Answer for a 7-mark question. Provide 6–8 well-explained points. Use numbered/bulleted lists with sub-details where needed. Include relevant definitions and examples from notes. Around 150–200 words.]`;
    case '14':
      return `\n\n[FORMAT: Answer for a 14-mark question. Provide a comprehensive, exam-ready answer with: 1) Introduction/definition, 2) Detailed explanation with 10+ points, 3) Diagrams requested if applicable, 4) Comparisons or classifications if relevant, 5) Conclusion. Use clear headings and sub-headings. Minimum 350–400 words.]`;
    default:
      return ''; // 'general' — no instruction appended
  }
}

// ── Process PDF note end-to-end ───────────────────────────────
async function processNote(filePath, note, jobId) {
  if (jobId) uploadJobs.set(jobId, { total: 100, completed: 0, status: 'extracting text' });
  const rawText    = await extractTextFromPDF(filePath);
  const textChunks = chunkText(rawText, 400, 40);
  if (jobId) uploadJobs.set(jobId, { total: textChunks.length, completed: 0, status: 'processing' });
  const embeddingResults = await generateEmbeddings(textChunks, jobId);
  const chunks = textChunks.map((text, i) => ({
    text,
    embedding: embeddingResults[i]?.embedding || [],
    index: i,
  }));
  if (jobId) uploadJobs.set(jobId, { total: textChunks.length, completed: textChunks.length, status: 'completed' });
  return { rawText, chunks };
}

module.exports = {
  extractTextFromPDF,
  chunkText,
  generateEmbedding,
  retrieveRelevantChunks,
  buildMarksInstruction,
  processNote,
  uploadJobs,
};
