// backend/routes/notebookRoutes.js
const express = require('express');
const router = express.Router();
const fetchUser = require('../middlewares/fetchUser');
const {
  getAllNotebooks,
  getNotebookById,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  getNotebookNotes
} = require('../controllers/notebookController');

// @route   GET /api/notebooks
// @desc    Get all notebooks of logged-in user
router.get('/', fetchUser, getAllNotebooks);

// @route   POST /api/notebooks
// @desc    Create a new notebook
router.post('/', fetchUser, createNotebook);

// @route   GET /api/notebooks/:id
// @desc    Get a specific notebook
router.get('/:id', fetchUser, getNotebookById);

// @route   PUT /api/notebooks/:id
// @desc    Update notebook name
router.put('/:id', fetchUser, updateNotebook);

// @route   DELETE /api/notebooks/:id
// @desc    Delete a notebook
router.delete('/:id', fetchUser, deleteNotebook);

// @route   GET /api/notebooks/:id/notes
// @desc    Get all notes in a specific notebook
router.get('/:id/notes', fetchUser, getNotebookNotes);

module.exports = router;
