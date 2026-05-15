const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  // title: auto-set from first user message, shown in the sidebar
  title:     { type: String, default: 'New Chat' },
  messages:  [messageSchema],
}, { timestamps: true });

// Non-unique index — allows multiple chat sessions per user per subject (like ChatGPT)
chatSchema.index({ userId: 1, subjectId: 1 });

module.exports = mongoose.model('Chat', chatSchema);
