import multer from "multer";

const imageStorage = multer.diskStorage({});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 3145728 * 10, // 3 MB * 10
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image")) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

const limitFileSize = 3145728; // 3 MB

export { imageUpload, limitFileSize };
