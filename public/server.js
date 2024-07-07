const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files for the assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve static files for the admin section
app.use('/admin', express.static(path.join(__dirname, '..', 'car-selling-admin', 'public')));

// Public routes
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'html', 'index.html');
    console.log('Attempting to serve:', filePath);
    res.sendFile(filePath);
});

const publicPages = ['carListings', 'carDetails', 'search', 'contact'];
publicPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        const filePath = path.join(__dirname, 'public', 'html', `${page}.html`);
        console.log('Attempting to serve:', filePath);
        res.sendFile(filePath);
    });
});

// Admin routes
app.get('/admin', (req, res) => {
    const filePath = path.join(__dirname, '..', 'car-selling-admin', 'public', 'html', 'index.html');
    console.log('Attempting to serve:', filePath);
    res.sendFile(filePath);
});

const adminPages = ['addCar', 'deleteCar', 'updateCar'];
adminPages.forEach(page => {
    app.get(`/admin/${page}`, (req, res) => {
        const filePath = path.join(__dirname, '..', 'car-selling-admin', 'public', 'html', `${page}.html`);
        console.log('Attempting to serve:', filePath);
        res.sendFile(filePath);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
