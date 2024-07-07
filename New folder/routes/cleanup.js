const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Car = require('../models/Car'); // Capital 'C' in Car

router.post('/clear-cache', (req, res) => {
  // If you're using any server-side caching mechanism, clear it here
  // For example, if you're using node-cache:
  // myCache.flushAll();
  res.json({ message: 'Server cache cleared' });
});

router.post('/cleanup-images', async (req, res) => {
  console.log('Cleanup route accessed');
  try {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    console.log('Upload directory:', uploadDir);
    const files = await fs.readdir(uploadDir);
    console.log('Files in upload directory:', files);
    
    const cars = await Car.find({});
    console.log('Number of cars found:', cars.length);
    const validImagePaths = cars.flatMap(car => car.images || [])
      .filter(imagePath => !imagePath.startsWith('http')); // Ignore external URLs
    console.log('Valid image paths:', validImagePaths);

    const orphanedImages = [];
    for (const file of files) {
      const filePath = path.join('uploads', file);
      if (!validImagePaths.includes(filePath)) {
        try {
          await fs.unlink(path.join(uploadDir, file));
          orphanedImages.push(filePath);
        } catch (unlinkError) {
          console.error(`Failed to delete file: ${file}`, unlinkError);
        }
      }
    }

    console.log('Orphaned images removed:', orphanedImages);
    res.json({ message: 'Cleanup completed', removedImages: orphanedImages });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Error during cleanup', error: error.message });
  }
});

module.exports = router;