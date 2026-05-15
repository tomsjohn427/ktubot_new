require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files (for admin reference)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/notes',    require('./routes/notes'));
app.use('/api/chats',    require('./routes/chats'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ktubot';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
