const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Function to set up the storage location and ensure directories exist
const storage = (subPath) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, `../uploads/${subPath}/`); // Use __dirname to handle relative paths correctly
    // Ensure the directory exists, and create it if it doesn't
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create parent directories if necessary
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}${fileExtension}`; // Create a unique filename
    cb(null, filename);
  }
});

// Multer middleware configuration
const upload = (key, subPath) => multer({
  storage: storage(subPath),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Invalid file type. Only jpeg, png, and gif are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  }
}).array(key, 10); // 'profileImages' is the field name, and the second argument limits to 10 files

module.exports = upload;
