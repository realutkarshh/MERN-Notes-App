// backend/controllers/noteController.js
const Note = require('../models/Note');
const Notebook = require('../models/Notebook');

// @desc    Get all notes of logged-in user
const getAllNotes = async (req, res) => {
  try {
    const { notebookId } = req.query;
    const filter = { user: req.user.id };
    
    // Filter by notebook if notebookId is provided
    if (notebookId) {
      filter.notebook = notebookId;
    }
    
    const notes = await Note.find(filter)
      .populate('notebook', 'name')
      .sort({ date: -1 });
    
    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
};

// @desc    Add a new note
const createNote = async (req, res) => {
  try {
    const { title, content, tag, notebookId } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: "Title is required" 
      });
    }

    // If notebookId not provided, use default notebook
    let targetNotebookId = notebookId;
    if (!targetNotebookId) {
      const defaultNotebook = await Notebook.findOne({
        user: req.user.id,
        isDefault: true
      });
      
      if (!defaultNotebook) {
        return res.status(404).json({
          success: false,
          error: "Default notebook not found"
        });
      }
      
      targetNotebookId = defaultNotebook._id;
    }

    // Verify notebook belongs to user
    const notebook = await Notebook.findOne({
      _id: targetNotebookId,
      user: req.user.id
    });

    if (!notebook) {
      return res.status(404).json({
        success: false,
        error: "Notebook not found"
      });
    }

    const note = new Note({
      title,
      content: content || '',
      tag: tag || 'General',
      user: req.user.id,
      notebook: targetNotebookId,
    });

    const savedNote = await note.save();
    const populatedNote = await Note.findById(savedNote._id)
      .populate('notebook', 'name');

    res.status(201).json({
      success: true,
      note: populatedNote
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
};

// @desc    Get a specific note
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('notebook', 'name');
    
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
};

// @desc    Update an existing note
const updateNote = async (req, res) => {
  try {
    const { title, content, tag, notebookId } = req.body;

    // Build note object
    const noteFields = {};
    if (title) noteFields.title = title;
    if (content !== undefined) noteFields.content = content;
    if (tag) noteFields.tag = tag;

    // If changing notebook, verify it exists and belongs to user
    if (notebookId) {
      const notebook = await Notebook.findOne({
        _id: notebookId,
        user: req.user.id
      });
      
      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: "Notebook not found"
        });
      }
      noteFields.notebook = notebookId;
    }

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
    ).populate('notebook', 'name');

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
};

// @desc    Delete an existing note
const deleteNote = async (req, res) => {
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
};

// @desc    Get shareable note data for QR code generation
const getShareableNote = async (req, res) => {
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
      sharedBy: req.user.id
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
};

// @desc    Receive a shared note from QR code scan
const receiveSharedNote = async (req, res) => {
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

    // Get user's default notebook for received shared notes
    const defaultNotebook = await Notebook.findOne({
      user: req.user.id,
      isDefault: true
    });

    if (!defaultNotebook) {
      return res.status(404).json({
        success: false,
        error: "Default notebook not found"
      });
    }

    // Create new note for the receiving user
    const newNote = new Note({
      title: `${title} (Shared)`,
      content: content,
      tag: tag || 'Shared',
      user: req.user.id,
      notebook: defaultNotebook._id,
    });

    const savedNote = await newNote.save();
    const populatedNote = await Note.findById(savedNote._id)
      .populate('notebook', 'name');
    
    res.status(201).json({
      success: true,
      message: "Note added successfully!",
      note: populatedNote
    });
  } catch (error) {
    console.error('Receive note error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to add shared note" 
    });
  }
};

module.exports = {
  getAllNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  getShareableNote,
  receiveSharedNote
};
