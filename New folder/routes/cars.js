const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage }).fields([
  { name: 'images', maxCount: 5 },
  { name: 'vin', maxCount: 1 },
  { name: 'make', maxCount: 1 },
  { name: 'model', maxCount: 1 },
  { name: 'year', maxCount: 1 },
  { name: 'price', maxCount: 1 },
  { name: 'lot', maxCount: 1 },
  { name: 'engine', maxCount: 1 },
  { name: 'transmission', maxCount: 1 },
  { name: 'fuelType', maxCount: 1 },
  { name: 'mileage', maxCount: 1 },
  { name: 'exteriorColor', maxCount: 1 },
  { name: 'features', maxCount: 1 },
  { name: 'history', maxCount: 1 },
  { name: 'dmvBackFees', maxCount: 1 }
]);

// Get all cars
router.get('/', async (req, res) => {
  console.log('Received request to fetch all cars');
  try {
    console.log('Attempting to query the database...');
    let cars = await Car.find().lean().maxTimeMS(30000); // Set a 30-second timeout
    console.log('Query completed. Number of cars fetched:', cars.length);
    
    // Remove duplicates based on _id
    cars = cars.filter((car, index, self) =>
      index === self.findIndex((t) => t._id.toString() === car._id.toString())
    );
    
    console.log('Number of cars after removing duplicates:', cars.length);
    res.json(cars);
  } catch (err) {
    console.error('Error fetching cars:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
    console.error('Error stack:', err.stack);
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      res.status(504).json({ message: 'Database query timed out', error: err.message });
    } else {
      res.status(500).json({ message: 'Error fetching cars from database', error: err.message });
    }
  }
});

// List all cars with IDs
router.get('/list-all', async (req, res) => {
  try {
    const cars = await Car.find().select('_id make model year');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new car
router.post('/', upload, async (req, res) => {
  console.log('Received request to add a new car');
  console.log('Request body:', req.body);
  console.log('Received files:', req.files);
  try {
    const carData = req.body;
    if (req.files && req.files.images) {
      carData.images = req.files.images.map(file => `/uploads/${file.filename}`);
    }
    console.log('Car data to be saved:', carData);
    const car = new Car(carData);
    console.log('Attempting to save car to database');
    const newCar = await car.save();
    console.log('New car saved to database:', newCar);
    res.status(201).json(newCar);
  } catch (err) {
    console.error('Error saving car to database:', err);
    console.error('Error stack:', err.stack);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }
    res.status(500).json({ message: 'Error adding car to database', error: err.message, stack: err.stack });
  }
});

// Update a car
router.put('/:id', upload, async (req, res) => {
  try {
    const carData = req.body;
    if (req.files && req.files.images) {
      const newImages = req.files.images.map(file => `/uploads/${file.filename}`);
      if (carData.images) {
        carData.images = carData.images.concat(newImages);
      } else {
        carData.images = newImages;
      }
    }
    const updatedCar = await Car.findByIdAndUpdate(req.params.id, carData, { new: true });
    res.json(updatedCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a car
router.delete('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Delete associated images
    const deletedImages = [];
    if (car.images && car.images.length > 0) {
      for (const imageUrl of car.images) {
        const imagePath = path.join(__dirname, '..', 'public', imageUrl);
        try {
          await fs.unlink(imagePath);
          deletedImages.push(imageUrl);
        } catch (err) {
          console.error(`Failed to delete image: ${imagePath}`, err);
        }
      }
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted', deletedImages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  console.log('Received request for car ID:', req.params.id);
  try {
    const car = await Car.findById(req.params.id);
    console.log('Database query result:', car);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (err) {
    console.error('Error in car fetch:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
