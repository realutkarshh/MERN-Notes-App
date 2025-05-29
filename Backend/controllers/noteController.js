const Note = require('../models/Note');

//Function to fetch a user
const fetchAUser = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ date: -1 });
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
}



module.exports = {
    fetchAUser
};