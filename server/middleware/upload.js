const multer = require('multer');
const path = require('path');

// Configure Multer storage to preserve the original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'docUploads/'); // Ensure this folder exists or create it
    },
    filename: (req, file, cb) => {
        const safeFilename = file.originalname.replace(/[\s]/g, '_'); // Replace spaces with underscores
        cb(null, safeFilename); // Store with original name, including Thai characters
    }
});

// File filter to accept only specific types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.docx', '.doc', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type'), false); // Reject the file
    }
};


// Set up the upload middleware with size limits (e.g., 5MB)
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter,
});

module.exports = upload;