const express = require('express');
const router = express.Router();
const Car = require('../admin/models/Car');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage: storage });

// Car routes
router.get('/cars', async (req, res, next) => {
  try {
    const cars = await Car.find().select('lot make model year vin price dmvBackFees createdAt');
    res.json({ cars });
  } catch (err) {
    next(err);
  }
});

router.get('/cars/vin/:vin', async (req, res, next) => {
  try {
    const car = await Car.findOne({ vin: req.params.vin });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (err) {
    next(err);
  }
});

router.get('/cars/:id', async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (err) {
    next(err);
  }
});

router.post('/cars', upload.array('carImages', 5), async (req, res, next) => {
  try {
    const carData = req.body;
    if (req.files && req.files.length > 0) {
      carData.images = req.files.map(file => `/public/uploads/${file.filename}`);
    }
    const newCar = await new Car(carData).save();
    res.status(201).json(newCar);
  } catch (err) {
    next(err);
  }
});

router.put('/cars/:id', upload.array('carImages', 5), async (req, res, next) => {
  try {
    const carData = req.body;
    const existingImages = JSON.parse(carData.existingImages || '[]');
    const newImages = req.files.map(file => `/public/uploads/${file.filename}`);
    carData.images = [...existingImages, ...newImages];

    const car = await Car.findByIdAndUpdate(req.params.id, carData, { new: true });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (err) {
    next(err);
  }
});

router.delete('/cars/:id', async (req, res, next) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// VIN lookup route
router.get('/vin-lookup/:vin', async (req, res, next) => {
  try {
    const vin = req.params.vin;
    const apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
    const response = await axios.get(apiUrl);
    const data = response.data.Results;
    
    const carDetails = {
      make: data.find(item => item.Variable === "Make")?.Value,
      model: data.find(item => item.Variable === "Model")?.Value,
      year: data.find(item => item.Variable === "Model Year")?.Value,
      engine: data.find(item => item.Variable === "Engine Model")?.Value,
      transmission: data.find(item => item.Variable === "Transmission Style")?.Value,
      fuelType: data.find(item => item.Variable === "Fuel Type - Primary")?.Value,
    };
    
    res.json(carDetails);
  } catch (error) {
    next(error);
  }
});

// Test route
router.get('/test', (req, res) => {
  res.send('API is working');
});

module.exports = router;