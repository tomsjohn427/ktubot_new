const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Note    = require('../models/Note');
const Subject = require('../models/Subject');
const { auth, adminOnly } = require('../middleware/auth');
const { processNote } = require('../utils/rag');

// ── Multer config ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// ── POST /api/notes/upload — admin uploads a PDF ──────────────
router.post('/upload', auth, adminOnly, upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

  // 1. EXTRACTION: We now grab the jobId sent by our React Progress component
  const { subjectId, moduleNumber, moduleName, jobId } = req.body; 
  
  if (!subjectId || !moduleNumber)
    return res.status(400).json({ message: 'subjectId and moduleNumber are required' });

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Create note record
    const note = await Note.create({
      subjectId,
      moduleNumber: parseInt(moduleNumber),
      moduleName:   moduleName || `Module ${moduleNumber}`,
      department:   subject.department,
      semester:     subject.semester,
      fileName:     req.file.filename,
      originalName: req.file.originalname,
      uploadedBy:   req.user._id,
      processed:    false,
    });

    // Process PDF asynchronously (don't block response)
    res.status(201).json({
      message: 'PDF uploaded. Processing started...',
      noteId:  note._id,
      note,
    });

    // Background processing
    setImmediate(async () => {
      try {
        const filePath = path.join(uploadDir, req.file.filename);
        
        // 2. TRACKING: We pass the jobId as the 3rd argument to processNote!
        const { rawText, chunks } = await processNote(filePath, note, jobId);

        await Note.findByIdAndUpdate(note._id, {
          rawText,
          chunks,
          processed: true,
        });
        console.log(`✅ Note ${note._id} processed: ${chunks.length} chunks`);
      } catch (err) {
        console.error(`❌ Note processing failed for ${note._id}:`, err.message);
        await Note.findByIdAndUpdate(note._id, { processed: false });
      }
    });

  } catch (err) {
    // Cleanup uploaded file on error
    if (req.file) {
      fs.unlink(path.join(uploadDir, req.file.filename), () => {});
    }
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/notes/subject/:subjectId — get notes for a subject ─
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Students can only access notes matching their dept+semester
    if (req.user.role === 'student') {
      if (subject.department !== req.user.department || subject.semester !== req.user.semester) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const notes = await Note.find({ subjectId: req.params.subjectId })
      .select('-chunks -rawText') // don't send heavy data
      .sort({ moduleNumber: 1 });

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/notes — admin: all notes ────────────────────────
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { department, semester, subjectId } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester   = parseInt(semester);
    if (subjectId)  filter.subjectId  = subjectId;

    const notes = await Note.find(filter)
      .select('-chunks -rawText')
      .populate('subjectId', 'name code')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/notes/:id — admin only ───────────────────────
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Remove physical file
    const filePath = path.join(uploadDir, note.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;