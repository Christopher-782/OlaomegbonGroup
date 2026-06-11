const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype !== "application/pdf" || ext !== ".pdf") {
    return cb(new Error("Only PDF files are allowed"), false);
  }

  cb(null, true);
};

const uploadGuarantorForm = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
});

module.exports = uploadGuarantorForm;
