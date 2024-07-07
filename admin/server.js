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

// Simulated authentication middleware (replace with real auth later)
const isAuthenticated = (req, res, next) => {
    // Check for the presence of the isLoggedIn item in the request cookies
    if (req.headers.cookie && req.headers.cookie.includes('isLoggedIn=true')) {
        next();
    } else {
        res.redirect('/');
    }
};

// Serve admin login page as the root route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'admin-login.html')));

// Logout route
app.get('/logout', (req, res) => {
    // In a real app, you'd destroy the session here
    res.redirect('/');
});

// Protected routes (require authentication)
app.get('/admin-dashboard', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'admin-dashboard.html')));
app.get('/car-details', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'car-details.html')));
app.get('/car-listings', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'car-listings.html')));
app.get('/car-management', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'car-management.html')));
app.get('/user-management', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'user-management.html')));

// Catch-all route for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'admin-login.html'));
});

app.listen(PORT, () => {
    console.log(`Admin server is running on port ${PORT}`);
});