//upload-complaint.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');

const sanitizeFilename = (filename) => {
  return filename.replace(/[<>:"\/\\|?*]/g, '').trim();
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/img/screenshotsuploads/screenshots');

    console.log('Upload path:', uploadPath);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    try {

      let filename = iconv.decode(Buffer.from(file.originalname, 'binary'), 'win1252');
      filename = sanitizeFilename(filename);


      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(filename));
    } catch (error) {
      console.error('Error processing filename:', error);
      cb(new Error('Error processing filename'));
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Images Only!'));
    }
  }
});

module.exports = upload;