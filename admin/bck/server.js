const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory within admin
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb+srv://walter:Walter_2024@cluster0.i6crrfv.mongodb.net/carsales?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Admin API routes
app.use('/api', require('./api'));

// Serve admin HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'admin-dashboard.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'admin-login.html')));
app.get('/car-details', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'car-details.html')));
app.get('/car-listings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'car-listings.html')));
app.get('/car-management', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'car-management.html')));
app.get('/user-management', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'user-management.html')));

// Catch-all route for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'admin-dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Admin server is running on port ${PORT}`);
});