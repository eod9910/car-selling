const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const mongoose = require('mongoose');

// GET all cars
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new car
router.post('/', async (req, res) => {
  const car = new Car({
    make: req.body.make,
    model: req.body.model,
    year: req.body.year,
    price: req.body.price,
    description: req.body.description
  });

  try {
    const newCar = await car.save();
    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET a specific car by ID
router.get('/:id', async (req, res) => {
  console.log('GET request for car with id:', req.params.id);
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const car = await Car.findById(req.params.id);
    if (car == null) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// UPDATE a car
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedCar == null) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(updatedCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a car
router.delete('/:id', async (req, res) => {
  console.log('DELETE request for car with id:', req.params.id);
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const car = await Car.findByIdAndDelete(req.params.id);
    if (car == null) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;