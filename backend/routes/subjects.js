const router = require('express').Router();
const Subject = require('../models/Subject');
const { auth, adminOnly } = require('../middleware/auth');

// ── GET /api/subjects ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      if (!req.user.department || !req.user.semester)
        return res.json({ subjects: [] }); // profile incomplete
      filter = { department: req.user.department, semester: req.user.semester };
    }
    // Admins get all subjects
    const subjects = await Subject.find(filter).sort({ semester: 1, name: 1 });
    res.json({ subjects });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/subjects/:id ─────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (req.user.role === 'student') {
      if (subject.department !== req.user.department || subject.semester !== req.user.semester)
        return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ subject });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/subjects — admin only ──────────────────────────
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, code, description, semester, department } = req.body;
    if (!name || !semester || !department)
      return res.status(400).json({ message: 'name, semester and department are required' });

    const subject = await Subject.create({
      name, code, description,
      semester: parseInt(semester),
      department,
      createdBy: req.user._id,
    });
    res.status(201).json({ subject });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Subject already exists for this department and semester' });
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/subjects/:id — admin only ────────────────────────
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ subject });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/subjects/:id — admin only + cascade ──────────
// Deletes the subject AND all its related notes and chats
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    // Cascade: remove all notes and chats tied to this subject
    await require('../models/Chat').deleteMany({ subjectId: req.params.id });
    await require('../models/Note').deleteMany({ subjectId: req.params.id });
    res.json({ message: 'Subject and all related data deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
