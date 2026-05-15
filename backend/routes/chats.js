const router  = require('express').Router();
const axios   = require('axios');
const Chat    = require('../models/Chat');
const Subject = require('../models/Subject');
const Note    = require('../models/Note');
const { auth } = require('../middleware/auth');
const { retrieveRelevantChunks, buildMarksInstruction } = require('../utils/rag');
const { getDiagramImage } = require('../utils/imageSearch');

/**
 * ── RAG answer via Ollama ─────────────────────────
 * Updated for STRICT grounding (notes only) and DOUBLE image rendering.
 */
async function getRAGAnswer(subject, conversationHistory, userQuestion, noteChunks, marksMode = 'general') {
  const relevantChunks = await retrieveRelevantChunks(userQuestion, noteChunks, 5);
  const context  = relevantChunks.join('\n\n---\n\n');
  const hasContext = context && context.trim().length > 20;

  // STRICT SYSTEM PROMPT: No internal knowledge fallbacks allowed.
  const systemPrompt = `You are KTUBot, a strict academic assistant for ${subject.name} (${subject.code || ''}).

STRICT OPERATING RULES:
1. ONLY USE CONTEXT: You must answer the user's question using ONLY the provided NOTES CONTEXT. 
2. NO EXTERNAL KNOWLEDGE: Do not use your own pre-trained knowledge base to answer technical or academic questions. If the information is not present in the notes, you must refuse to answer.
3. OUT OF SCOPE: If a question is not covered in the notes, respond EXACTLY with: "❌ I'm sorry, but this topic is not covered in the provided study materials for ${subject.name}."
4. MATHEMATICS: Format all formulas using standard LaTeX markdown ($ for inline, $$ for block).
5. VISUALS: For complex concepts mentioned in the notes, add the tag [SEARCH_IMAGE: exact name of concept] on a new line.

${hasContext 
  ? `NOTES CONTEXT:\n${context}` 
  : 'NO NOTES CONTEXT AVAILABLE: You must refuse to answer any technical questions and state that no notes are available.'}`;

  const marksInstruction  = buildMarksInstruction(marksMode);
  const formattedQuestion = userQuestion + marksInstruction;

  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3.2:3b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: formattedQuestion },
      ],
      stream: false,
    });

    let reply = response.data.message.content.trim();

    // Check for refusal before searching for images
    if (reply.includes("❌ I'm sorry, but this topic is not covered")) {
      return reply;
    }

    // --- DOUBLE IMAGE RENDERING ---
    const imageRegex = /\[SEARCH_IMAGE:\s*(.*?)\]/g;
    const matches = [...reply.matchAll(imageRegex)];
    
    for (const match of matches) {
      const fullTag  = match[0];
      const query    = match[1];
      
      // Fetches array of up to 2 URLs from Wikimedia (from our previous update to utils/imageSearch.js)
      const imageUrls = await getDiagramImage(query);
      
      if (imageUrls && imageUrls.length > 0) {
        const imageMarkdown = imageUrls
          .map((url, index) => `\n\n![Diagram ${index + 1}: ${query}](${url})\n*Generated diagram for ${query} (View ${index + 1})*`)
          .join('');
        
        reply = reply.replace(fullTag, imageMarkdown);
      } else {
        reply = reply.replace(fullTag, `\n\n*(Visual diagram for "${query}" could not be loaded)*\n\n`);
      }
    }

    return reply;
  } catch (err) {
    console.error('Ollama Chat Error:', err.message);
    return '⚠️ AI service error: Ensure Ollama is running locally with the llama model.';
  }
}

// ── GET /api/chats — all chats for logged-in user ─────────────
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .populate('subjectId', 'name code semester department')
      .sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/chats/subject/:subjectId — most recent chat ──────
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (req.user.role === 'student') {
      if (subject.department !== req.user.department || subject.semester !== req.user.semester)
        return res.status(403).json({ message: 'Access denied' });
    }
    const chat = await Chat.findOne({ userId: req.user._id, subjectId: req.params.subjectId })
      .sort({ updatedAt: -1 })
      .populate('subjectId', 'name code semester department');
    if (!chat) return res.status(404).json({ message: 'No chat found' });
    res.json({ chat });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/chats/new — create a blank chat session ─────────
router.post('/new', auth, async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) return res.status(400).json({ message: 'subjectId required' });
    const chat = await Chat.create({ userId: req.user._id, subjectId, title: 'New Chat', messages: [] });
    res.json({ chatId: chat._id, chat });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/chats/message ───────────────────────────────────
router.post('/message', auth, async (req, res) => {
  try {
    const { subjectId, message, chatId, marksMode = 'general' } = req.body;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    let chat = chatId ? await Chat.findOne({ _id: chatId, userId: req.user._id }) : null;
    if (!chat) chat = await Chat.create({ userId: req.user._id, subjectId, title: 'New Chat', messages: [] });

    const notes = await Note.find({ subjectId, processed: true }).select('chunks');
    const allChunks = notes.flatMap(n => n.chunks || []);

    chat.messages.push({ role: 'user', content: message });
    if (chat.messages.filter(m => m.role === 'user').length === 1) chat.title = message.slice(0, 60);

    const reply = await getRAGAnswer(subject, chat.messages.slice(0, -1), message, allChunks, marksMode);
    chat.messages.push({ role: 'assistant', content: reply });
    await chat.save();

    res.json({ chatId: chat._id, reply, messages: chat.messages, title: chat.title });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/chats/:id ─────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;