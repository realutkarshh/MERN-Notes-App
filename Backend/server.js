// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables first
dotenv.config();

const app = express();

// Basic middleware
app.use(express.json());

// Test route to verify server works
app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.use(cors({
  origin: 'http://localhost:3000', // allow this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // if you're using cookies
}));

// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://mern-notes-app-tawny.vercel.app'
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true, // If using cookies or auth headers
// }));


// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/notesapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Import and use routes one by one to isolate the issue
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  const noteRoutes = require('./routes/noteRoutes');
  app.use('/api/notes', noteRoutes);
  console.log('✅ Note routes loaded');
} catch (error) {
  console.error('❌ Error loading note routes:', error.message);
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});