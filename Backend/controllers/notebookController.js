// backend/controllers/notebookController.js
const Notebook = require('../models/Notebook');
const Note = require('../models/Note');

// @desc    Get all notebooks of logged-in user
const getAllNotebooks = async (req, res) => {
  try {
    const notebooks = await Notebook.find({ user: req.user.id })
      .sort({ createdAt: 1 });
    
    // Get note count for each notebook
    const notebooksWithCount = await Promise.all(
      notebooks.map(async (notebook) => {
        const noteCount = await Note.countDocuments({ 
          notebook: notebook._id,
          user: req.user.id 
        });
        return {
          ...notebook.toObject(),
          noteCount
        };
      })
    );
    
    res.json({
      success: true,
      count: notebooksWithCount.length,
      notebooks: notebooksWithCount
    });
  } catch (error) {
    console.error('Get notebooks error:', error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

// @desc    Get a specific notebook
const getNotebookById = async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);
    
    if (!notebook) {
      return res.status(404).json({
        success: false,
        error: "Notebook not found"
      });
    }

    // Check if notebook belongs to user
    if (notebook.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this notebook"
      });
    }

    // Get note count
    const noteCount = await Note.countDocuments({ 
      notebook: notebook._id,
      user: req.user.id 
    });

    res.json({
      success: true,
      notebook: {
        ...notebook.toObject(),
        noteCount
      }
    });
  } catch (error) {
    console.error('Get notebook error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid notebook ID"
      });
    }
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

// @desc    Create a new notebook
const createNotebook = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Notebook name is required"
      });
    }

    // Check if notebook with same name exists
    const existingNotebook = await Notebook.findOne({
      user: req.user.id,
      name: name.trim()
    });

    if (existingNotebook) {
      return res.status(400).json({
        success: false,
        error: "A notebook with this name already exists"
      });
    }

    const notebook = new Notebook({
      name: name.trim(),
      user: req.user.id,
      isDefault: false,
    });

    const savedNotebook = await notebook.save();

    res.status(201).json({
      success: true,
      notebook: {
        ...savedNotebook.toObject(),
        noteCount: 0
      }
    });
  } catch (error) {
    console.error('Create notebook error:', error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

// @desc    Update notebook name
const updateNotebook = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Notebook name is required"
      });
    }

    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({
        success: false,
        error: "Notebook not found"
      });
    }

    // Check user ownership
    if (notebook.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to update this notebook"
      });
    }

    // Prevent renaming default notebook
    if (notebook.isDefault) {
      return res.status(400).json({
        success: false,
        error: "Cannot rename the default notebook 'NoteStack'"
      });
    }

    // Check for duplicate names
    const existingNotebook = await Notebook.findOne({
      user: req.user.id,
      name: name.trim(),
      _id: { $ne: req.params.id }
    });

    if (existingNotebook) {
      return res.status(400).json({
        success: false,
        error: "A notebook with this name already exists"
      });
    }

    notebook.name = name.trim();
    const updatedNotebook = await notebook.save();

    // Get note count
    const noteCount = await Note.countDocuments({ 
      notebook: updatedNotebook._id,
      user: req.user.id 
    });

    res.json({
      success: true,
      notebook: {
        ...updatedNotebook.toObject(),
        noteCount
      }
    });
  } catch (error) {
    console.error('Update notebook error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid notebook ID"
      });
    }
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

// @desc    Delete a notebook
const deleteNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({
        success: false,
        error: "Notebook not found"
      });
    }

    // Check user ownership
    if (notebook.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to delete this notebook"
      });
    }

    // Prevent deleting default notebook
    if (notebook.isDefault) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete the default notebook 'NoteStack'"
      });
    }

    // Move all notes from this notebook to default notebook
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

    // Count notes to be moved
    const notesToMove = await Note.countDocuments({ 
      notebook: req.params.id,
      user: req.user.id 
    });

    // Move notes to default notebook
    await Note.updateMany(
      { notebook: req.params.id, user: req.user.id },
      { $set: { notebook: defaultNotebook._id } }
    );

    await Notebook.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: notesToMove > 0 
        ? `Notebook deleted successfully. ${notesToMove} note(s) moved to 'NoteStack'.`
        : "Notebook deleted successfully."
    });
  } catch (error) {
    console.error('Delete notebook error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid notebook ID"
      });
    }
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

// @desc    Get all notes in a specific notebook
const getNotebookNotes = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notebook) {
      return res.status(404).json({
        success: false,
        error: "Notebook not found"
      });
    }

    const notes = await Note.find({
      user: req.user.id,
      notebook: req.params.id
    })
      .populate('notebook', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      notebook: notebook.name,
      notebookId: notebook._id,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Get notebook notes error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid notebook ID"
      });
    }
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

module.exports = {
  getAllNotebooks,
  getNotebookById,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  getNotebookNotes
};
