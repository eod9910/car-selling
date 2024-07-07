const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF image files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  }
});

router.post('/', upload.single('image'), (req, res) => {
  console.log('File upload request received');
  if (req.file) {
    console.log('File uploaded:', req.file);
    // Send back the relative path
    res.json({ path: '/uploads/' + req.file.filename });
  } else {
    console.log('No file uploaded');
    res.status(400).json({ error: 'No file uploaded' });
  }
});

router.use((error, req, res, next) => {
  console.error('Upload error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size is too large. Max limit is 5MB' });
    }
  }
  if (error.message === 'Invalid file type. Only JPEG, PNG and GIF image files are allowed.') {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: 'Something went wrong during upload' });
});

module.exports = router;