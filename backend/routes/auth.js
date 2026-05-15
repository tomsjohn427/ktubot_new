const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, semester, department } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'username, email and password are required' });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ message: 'Username or email already taken' });

    const user = await User.create({ username, email, password, semester, department, role: 'student' });
    res.status(201).json({ message: 'Account created successfully', user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'username and password are required' });

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, semester, department, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (email)      user.email      = email;
    if (semester)   user.semester   = semester;
    if (department !== undefined) user.department = department;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
      const ok = await user.comparePassword(currentPassword);
      if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }

    await user.save();
    res.json({ message: 'Profile updated', user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
