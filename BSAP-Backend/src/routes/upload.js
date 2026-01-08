const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');

// File upload endpoint
router.post('/', uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(201).json({ status: 'ERROR', message: 'No file uploaded' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/performanceDocs/${req.file.filename}`;
  res.status(200).json({
    status: 'SUCCESS',
    message: 'File uploaded successfully',
    fileUrl
  });
});

module.exports = router;
