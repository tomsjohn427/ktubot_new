const router  = require('express').Router();
const User    = require('../models/User');
const Subject = require('../models/Subject');
const Chat    = require('../models/Chat');
const Note    = require('../models/Note');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadJobs } = require('../utils/rag'); // <--- 1. IMPORT THE TRACKER

router.use(auth, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, subjects, chats, notes, msgAgg] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Chat.countDocuments(),
      Note.countDocuments(),
      Chat.aggregate([
        { $project: { count: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
    ]);
    res.json({ stats: { users, subjects, chats, notes, messages: msgAgg[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    await Chat.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/chats
router.get('/chats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const chats = await Chat.find()
      .populate('userId', 'username email')
      .populate('subjectId', 'name code')
      .sort({ updatedAt: -1 })
      .limit(limit);
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── NEW: PROGRESS TRACKING ROUTE ──────────────────────────────
// GET /api/admin/upload-progress/:jobId
router.get('/upload-progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const jobProgress = uploadJobs.get(jobId);

  if (!jobProgress) {
    // If it's not in the map yet, just tell the frontend it's starting
    return res.json({ total: 100, completed: 0, status: 'initializing' }); 
  }

  res.json(jobProgress);
});

module.exports = router;