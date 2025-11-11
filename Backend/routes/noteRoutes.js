// backend/routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const fetchUser = require('../middlewares/fetchUser');
const {
  getAllNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  getShareableNote,
  receiveSharedNote
} = require('../controllers/noteController');

// @route   GET /api/notes
// @desc    Get all notes of logged-in user
router.get('/', fetchUser, getAllNotes);

// @route   POST /api/notes
// @desc    Add a new note
router.post('/', fetchUser, createNote);

// @route   GET /api/notes/share/:id
// @desc    Get shareable note data for QR code generation
router.get('/share/:id', fetchUser, getShareableNote);

// @route   POST /api/notes/receive
// @desc    Receive a shared note from QR code scan
router.post('/receive', fetchUser, receiveSharedNote);

// @route   GET /api/notes/:id
// @desc    Get a specific note
router.get('/:id', fetchUser, getNoteById);

// @route   PUT /api/notes/:id
// @desc    Update an existing note
router.put('/:id', fetchUser, updateNote);

// @route   DELETE /api/notes/:id
// @desc    Delete an existing note
router.delete('/:id', fetchUser, deleteNote);

module.exports = router;
