import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageUpload = multer({
    storage: multer.diskStorage({}),
    limits: {
        fileSize: 3145728, // 3 MB
    },
    fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith("image")) {
            return cb(new Error("Please upload an image"));
        }
        cb(undefined, true);
    },
});

const limitFileSize = 3145728; // 3 MB

export { cloudinary, imageUpload, limitFileSize };
