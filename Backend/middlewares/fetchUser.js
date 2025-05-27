const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
  // Get token from the 'Authorization' header
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Please authenticate using a valid token" });
  }

  const token = authHeader.split(' ')[1]; // Extract token part

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user; // Assumes token payload: { user: { id: ... } }
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ error: "Please authenticate using a valid token" });
  }
};

module.exports = fetchUser;
