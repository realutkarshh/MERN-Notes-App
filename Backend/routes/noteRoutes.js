// backend/routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const fetchUser = require('../middlewares/fetchUser');
const { fetchAUser } = require('../controllers/noteController');

// @route   GET /api/notes
// @desc    Get all notes of logged-in user
router.get('/', fetchAUser);

// @route   POST /api/notes
// @desc    Add a new note
router.post('/', fetchUser, async (req, res) => {
  try {
    const { title, content, tag } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: "Title is required" 
      });
    }

    const note = new Note({
      title,
      content: content || '',
      tag: tag || 'General',
      user: req.user.id,
    });

    const savedNote = await note.save();
    res.status(201).json({
      success: true,
      note: savedNote
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

// @route   GET /api/notes/:id
// @desc    Get a specific note
router.get('/:id', fetchUser, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        error: "Note not found" 
      });
    }

    // Check if note belongs to user
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authorized to access this note" 
      });
    }

    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Get note error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid note ID" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update an existing note
router.put('/:id', fetchUser, async (req, res) => {
  try {
    const { title, content, tag } = req.body;

    // Build note object
    const noteFields = {};
    if (title) noteFields.title = title;
    if (content !== undefined) noteFields.content = content;
    if (tag) noteFields.tag = tag;

    // Find note
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        error: "Note not found" 
      });
    }

    // Check user ownership
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authorized to update this note" 
      });
    }

    // Update note
    note = await Note.findByIdAndUpdate(
      req.params.id, 
      { $set: noteFields }, 
      { new: true }
    );

    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Update note error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid note ID" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete an existing note
router.delete('/:id', fetchUser, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        error: "Note not found" 
      });
    }

    // Check user ownership
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authorized to delete this note" 
      });
    }

    await Note.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: "Note has been deleted successfully" 
    });
  } catch (error) {
    console.error('Delete note error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid note ID" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

// NEW ROUTES FOR QR CODE SHARING

// @route   GET /api/notes/share/:id
// @desc    Get shareable note data for QR code generation
router.get('/share/:id', fetchUser, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        error: "Note not found" 
      });
    }

    // Check if note belongs to user
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authorized to share this note" 
      });
    }

    // Return note data for QR code (without sensitive user info)
    const shareableData = {
      noteId: note._id,
      title: note.title,
      content: note.content,
      tag: note.tag,
      originalDate: note.date,
      sharedBy: req.user.id // We'll use this to prevent self-sharing
    };

    res.json({
      success: true,
      shareData: shareableData
    });
  } catch (error) {
    console.error('Share note error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid note ID" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

// @route   POST /api/notes/receive
// @desc    Receive a shared note from QR code scan
router.post('/receive', fetchUser, async (req, res) => {
  try {
    const { noteId, title, content, tag, originalDate, sharedBy } = req.body;


    // Validation
    if (!title || !noteId) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid share data" 
      });
    }

    // Prevent users from adding their own notes
    if (sharedBy === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: "You cannot add your own note" 
      });
    }

    // Check if user already has this note (prevent duplicates)
    const existingNote = await Note.findOne({
      user: req.user.id,
      title: title,
      content: content
    });

    if (existingNote) {
      return res.status(400).json({ 
        success: false, 
        error: "You already have this note" 
      });
    }

    // Create new note for the receiving user
    const newNote = new Note({
      title: `${title} (Shared)`, // Add indicator that it's shared
      content: content,
      tag: tag || 'Shared',
      user: req.user.id,
      // We could add a field to track it's shared, but keeping it simple
    });

    const savedNote = await newNote.save();
    
    res.status(201).json({
      success: true,
      message: "Note added successfully!",
      note: savedNote
    });
  } catch (error) {
    console.error('Receive note error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to add shared note" 
    });
  }
});

module.exports = router;