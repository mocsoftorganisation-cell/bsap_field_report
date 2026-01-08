const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/performanceDocs';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
