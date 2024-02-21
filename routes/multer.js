const crypto = require('crypto');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads');
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const fileName = crypto.randomBytes(8).toString('hex') + fileExt;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
