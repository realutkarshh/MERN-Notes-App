// backend/models/Notebook.js
const mongoose = require('mongoose');

const notebookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure each user can't have duplicate notebook names
notebookSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Notebook', notebookSchema);
