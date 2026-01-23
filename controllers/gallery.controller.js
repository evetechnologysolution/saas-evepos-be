import multer from "multer";
import Gallery from "../models/gallery.js";
import { cloudinary } from "../lib/cloudinary.js";
import { imageUpload } from "../lib/fileUpload.js";

// GETTING ALL THE DATA
export const getAllGallery = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            query = {
                ...query,
                name: { $regex: search, $options: "i" },
            };
        }
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        };
        const listofData = await Gallery.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET A SPECIFIC DATA
export const getGalleryById = async (req, res) => {
    try {
        const spesificData = await Gallery.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addGallery = async (req, res) => {
    imageUpload.single("image")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: "Failed",
                message: err?.message || "Failed to upload image",
            });
        } else if (err) {
            return res.status(400).json({
                status: "Failed",
                message: err?.message || "Failed to upload image",
            });
        }

        try {
            let objData = req.body;

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_MAIN,
                    format: "webp",
                    transformation: [
                        // { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired (low, eco, good, best)
                    ],
                });
                objData = Object.assign(objData, {
                    image: cloud.secure_url,
                    imageId: cloud.public_id,
                });
            }

            const data = new Gallery(objData);
            const newData = await data.save();
            return res.json(newData);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    });
};

// UPDATE A SPECIFIC DATA
export const editGallery = async (req, res) => {
    imageUpload.single("image")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: "Failed",
                message: err?.message || "Failed to upload image",
            });
        } else if (err) {
            return res.status(400).json({
                status: "Failed",
                message: err?.message || "Failed to upload image",
            });
        }

        try {
            let objData = req.body;

            const exist = await Gallery.findById(req.params.id);

            if (req.file) {
                // Chek & delete image
                if (exist?.imageId) {
                    await cloudinary.uploader.destroy(exist.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_MAIN,
                    format: "webp",
                    transformation: [
                        // { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired (low, eco, good, best)
                    ],
                });
                objData = Object.assign(objData, {
                    image: cloud.secure_url,
                    imageId: cloud.public_id,
                });
            }

            const updatedData = await Gallery.updateOne(
                { _id: req.params.id },
                {
                    $set: objData,
                },
            );
            return res.json(updatedData);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    });
};

// DELETE A SPECIFIC DATA
export const deleteGallery = async (req, res) => {
    try {
        // Check image & delete image
        const exist = await Gallery.findById(req.params.id);
        if (exist?.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }
        const deletedData = await Gallery.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
