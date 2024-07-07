const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const cors = require('cors');

// Move these import statements to the top of the file, with other imports
const carRoutes = require('./routes/cars');
const uploadRoutes = require('./routes/upload');
const cleanupRoutes = require('./routes/cleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    console.log('Serving file:', path);
    if (path.endsWith('.css')) {
      console.log('Setting Content-Type for CSS file');
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      console.log('Setting Content-Type for JavaScript file');
      res.setHeader('Content-Type', 'application/javascript');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.get('*.js', (req, res) => {
  console.log('JavaScript file specifically requested');
  const jsPath = path.join(__dirname, 'public', req.path);
  console.log('JavaScript file path:', jsPath);
  console.log('File exists:', fs.existsSync(jsPath));
  res.sendFile(jsPath, {
    headers: {
      'Content-Type': 'application/javascript'
    }
  });
});

app.get('/style.css', (req, res) => {
  console.log('CSS file specifically requested');
  const cssPath = path.join(__dirname, 'public', 'style.css');
  console.log('CSS file path:', cssPath);
  console.log('File exists:', fs.existsSync(cssPath));
  res.sendFile(cssPath, {
    headers: {
      'Content-Type': 'text/css'
    }
  });
});

// Define authMiddleware here, before any routes
const authMiddleware = (req, res, next) => {
    console.log('Auth middleware called for:', req.url);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Received token:', token ? 'Present' : 'Not found');

    if (!token) {
        console.log('No token provided, sending 401');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Public routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/carListings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'carListings.html'));
});

app.get('/search.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'search.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'contact.html'));
});

app.get('/cms-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cms-login.html'));
});

// Protected routes
app.get('/cms.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cms.html'));
});

app.get('/api/cms-data', authMiddleware, (req, res) => {
    // Return CMS data
    res.json({
        message: 'CMS data retrieved successfully',
        data: { /* your CMS data */ }
    });
});

// This line can now stay as is
app.use('/api/cars', authMiddleware, carRoutes);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// JWT Secret
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in the environment variables');
  process.exit(1);
}

// If you have a catch-all route, make sure it's after all other routes
app.get('*', (req, res) => {
    console.log('Catch-all route hit for:', req.url);
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// Connect to MongoDB
console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//****:****@'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log("Connected successfully to MongoDB");
  console.log("MongoDB connection state:", mongoose.connection.readyState);
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
  console.error("Error details:", JSON.stringify(err, null, 2));
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection disconnected through app termination');
    process.exit(0);
  });
});

// Add this near your other routes
app.get('/api/auth/check-setup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ setupNeeded: userCount === 0 });
  } catch (error) {
    console.error('Error checking setup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new route for user registration
app.post('/api/auth/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    console.log('Missing username or password');
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists:', username);
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    console.log('User created successfully:', username);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt for user:', username);

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        console.log('JWT_SECRET used for signing:', process.env.JWT_SECRET);
        const payload = { id: user._id };
        console.log('Token payload:', payload);
        console.log('Current server time:', new Date().toISOString());
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated token:', token);
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
