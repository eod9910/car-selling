const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');  // Add this line
const Car = require('../models/Car');
const multer = require('multer');
const path = require('path');

// Set up multer storage
const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 60000,
}).then(() => {
    console.log('Connected to MongoDB');
    
    // Define your routes here
    router.delete('/reset-database', async (req, res) => {
        try {
            console.log('Attempting to reset database...');
            const result = await Car.deleteMany({});
            console.log('Reset database result:', result);
            res.json({ message: 'Database reset successful', result });
        } catch (error) {
            console.error('Error resetting database:', error);
            res.status(500).json({ message: 'Failed to reset database', error: error.message });
        }
    });

    // Add test car route
    router.post('/add-test-car', async (req, res) => {
        try {
            console.log('Attempting to add test car...');
            const testCar = new Car({
                vin: 'TEST' + Date.now(),
                make: 'Test Make',
                model: 'Test Model',
                year: 2024,
                price: 10000,
                mileage: 0,
                lot: 'Test Lot'
            });
            const savedCar = await testCar.save();
            console.log('Test car added:', savedCar);
            res.status(201).json(savedCar);
        } catch (error) {
            console.error('Error adding test car:', error);
            res.status(500).json({ message: 'Failed to add test car', error: error.message });
        }
    });

    // GET cars route
    router.get('/cars', async (req, res) => {
        try {
            console.log('Attempting to fetch cars from database...');
            const startTime = Date.now();
            const cars = await Car.find().limit(10);
            const endTime = Date.now();
            console.log(`Successfully fetched ${cars.length} cars in ${endTime - startTime}ms`);
            res.json(cars);
        } catch (error) {
            console.error('Error fetching cars:', error);
            res.status(500).json({ message: 'Failed to fetch cars', error: error.message });
        }
    });

    // Modify the Add new car route
    router.post('/cars', upload.array('carImages', 5), async (req, res) => {
        try {
            console.log('Attempting to add new car:', req.body);
            const carData = req.body;
            
            // Handle uploaded files
            if (req.files && req.files.length > 0) {
                carData.images = req.files.map(file => ({
                    data: file.buffer,
                    contentType: file.mimetype
                }));
            }

            // Handle existing images
            if (req.body.existingImages) {
                const existingImages = JSON.parse(req.body.existingImages);
                carData.images = (carData.images || []).concat(existingImages);
            }

            const newCar = new Car(carData);
            console.log('Created new Car instance:', newCar);
            console.log('Attempting to save car to database...');
            
            const startTime = Date.now();
            const savedCar = await newCar.save();
            const endTime = Date.now();
            
            console.log(`New car added successfully in ${endTime - startTime}ms:`, savedCar);
            res.status(201).json(savedCar);
        } catch (error) {
            console.error('Error adding new car:', error);
            if (error.name === 'ValidationError') {
                console.error('Validation error details:', error.errors);
                res.status(400).json({ message: 'Validation failed', errors: error.errors });
            } else {
                res.status(500).json({ message: 'Failed to add new car', error: error.message });
            }
        }
    });

    // Add this test route
    router.get('/test-db', async (req, res) => {
        try {
            console.log('Testing database connection...');
            const result = await mongoose.connection.db.admin().ping();
            console.log('Database ping result:', result);
            res.json({ message: 'Database connection successful', result });
        } catch (error) {
            console.error('Database connection test failed:', error);
            res.status(500).json({ message: 'Database connection test failed', error: error.message });
        }
    });

    // Add this test route
    router.get('/connection-status', (req, res) => {
        const status = mongoose.connection.readyState;
        let statusMessage;
        switch (status) {
            case 0: statusMessage = 'Disconnected'; break;
            case 1: statusMessage = 'Connected'; break;
            case 2: statusMessage = 'Connecting'; break;
            case 3: statusMessage = 'Disconnecting'; break;
            default: statusMessage = 'Unknown';
        }
        res.json({ status: statusMessage, readyState: status });
    });

    // Add this route to test inserting a simple document
    router.post('/test-insert', async (req, res) => {
        try {
            console.log('Attempting to insert test document...');
            const startTime = Date.now();
            const result = await mongoose.connection.db.collection('test').insertOne({ test: 'document', timestamp: new Date() });
            const endTime = Date.now();
            console.log(`Test document inserted in ${endTime - startTime}ms:`, result);
            res.json({ message: 'Test document inserted', result });
        } catch (error) {
            console.error('Error inserting test document:', error);
            res.status(500).json({ message: 'Failed to insert test document', error: error.message });
        }
    });

    // Add this new route to check if a car with a given VIN exists
    router.get('/cars/check-vin/:vin', async (req, res) => {
        try {
            const car = await Car.findOne({ vin: req.params.vin });
            res.json({ exists: !!car, carId: car ? car._id : null });
        } catch (error) {
            res.status(500).json({ message: 'Error checking VIN', error: error.message });
        }
    });

    // GET single car by ID
    router.get('/cars/:id', async (req, res) => {
        try {
            const carId = req.params.id;
            console.log('Fetching car with ID:', carId);
            const car = await Car.findById(carId);
            
            if (!car) {
                console.log('Car not found with ID:', carId);
                return res.status(404).json({ message: 'Car not found' });
            }
            
            console.log('Successfully fetched car:', car);
            res.json(car);
        } catch (error) {
            console.error('Error fetching car:', error);
            res.status(500).json({ message: 'Failed to fetch car', error: error.message });
        }
    });

    // Update the PUT route to handle updates by VIN
    router.put('/cars/:id', upload.array('carImages', 5), async (req, res) => {
        try {
            const carId = req.params.id;
            const carData = req.body;
            
            // Handle uploaded files
            if (req.files && req.files.length > 0) {
                carData.images = req.files.map(file => ({
                    data: file.buffer,
                    contentType: file.mimetype
                }));
            }

            // Handle existing images
            if (req.body.existingImages) {
                const existingImages = JSON.parse(req.body.existingImages);
                carData.images = (carData.images || []).concat(existingImages);
            }

            const updatedCar = await Car.findByIdAndUpdate(carId, carData, { new: true, runValidators: true });
            
            if (!updatedCar) {
                return res.status(404).json({ message: 'Car not found' });
            }
            
            res.json(updatedCar);
        } catch (error) {
            console.error('Error updating car:', error);
            res.status(500).json({ message: 'Failed to update car', error: error.message });
        }
    });

    // Start your server here
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

module.exports = router;