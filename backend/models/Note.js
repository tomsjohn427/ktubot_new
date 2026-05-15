const mongoose = require('mongoose');

// Each chunk of text extracted from a PDF with its embedding
const chunkSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  embedding: { type: [Number], default: [] }, // OpenAI embedding vector
  index:     { type: Number },                // chunk order
}, { _id: false });

const noteSchema = new mongoose.Schema({
  subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  moduleNumber: { type: Number, required: true, min: 1, max: 10 },
  moduleName:   { type: String, trim: true },
  department:   { type: String, required: true },
  semester:     { type: Number, required: true },
  fileName:     { type: String, required: true },
  originalName: { type: String },
  rawText:      { type: String },           // full extracted text
  chunks:       [chunkSchema],              // text chunks with embeddings
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processed:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
