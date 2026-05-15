const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, trim: true },
  description: { type: String, trim: true },
  semester:    { type: Number, required: true, min: 1, max: 8 },
  department:  { type: String, required: true, enum: ['CSE','ECE','EEE','ME','CE','IT'] },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Unique subject per dept+semester+name
subjectSchema.index({ name: 1, department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
