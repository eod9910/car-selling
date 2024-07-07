require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Log the current directory
console.log('Current directory:', __dirname);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes for HTML pages
const htmlPath = path.join(__dirname, 'public', 'html');

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(htmlPath, 'admin-dashboard.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(htmlPath, 'admin-login.html'));
});

app.get('/car-details', (req, res) => {
  res.sendFile(path.join(htmlPath, 'car-details.html'));
});

app.get('/car-listings', (req, res) => {
  res.sendFile(path.join(htmlPath, 'car-listings.html'));
});

app.get('/car-management', (req, res) => {
  res.sendFile(path.join(htmlPath, 'car-management.html'));
});

app.get('/user-management', (req, res) => {
  res.sendFile(path.join(htmlPath, 'user-management.html'));
});

// Import Car model
const Car = require('./models/Car');

// CRUD Operations
// Create a new car
app.post('/api/cars', async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all cars
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read a specific car
app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a car
app.put('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a car
app.delete('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (car) {
      res.json({ message: 'Car deleted successfully' });
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Catch-all route for debugging
app.use((req, res) => {
  res.status(404).send(`File not found. Requested path: ${req.path}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});