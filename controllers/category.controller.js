import multer from "multer";
import Category from "../models/category.js";
import { cloudinary, imageUpload } from "../lib/cloudinary.js";

// GETTING ALL THE DATA
export const getAllCategory = async (req, res) => {
    try {
        const listofData = await Category.find().sort({ "listNumber": 1 });
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING ALL THE DATA
export const getPaginateCategory = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            query = {
                ...query,
                name: { $regex: search, $options: 'i' }, // option i for case insensitivity to match upper and lower cases.
            };
        };
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
        }
        const listofData = await Category.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const spesificData = await Category.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addCategory = async (req, res) => {
    try {
        imageUpload.single("image")(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Failed to upload image",
                });
            } else if (err) {
                return res.status(400).json({
                    status: "Failed",
                    message: err.message.message,
                });
            }

            let objData = req.body;

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" } // Adjust the compression level if desired
                    ]
                });
                objData = Object.assign(objData, { image: cloud.secure_url, imageId: cloud.public_id });
            }

            const data = new Category(objData);
            const newData = await data.save();
            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editCategory = async (req, res) => {
    try {
        imageUpload.single("image")(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Failed to upload image",
                });
            } else if (err) {
                return res.status(400).json({
                    status: "Failed",
                    message: err.message.message,
                });
            }
            let objData = req.body;

            if (req.file) {
                // Chek image & delete image
                const exist = await Category.findById(req.params.id);
                if (exist.imageId) {
                    await cloudinary.uploader.destroy(exist.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" } // Adjust the compression level if desired
                    ]
                });
                objData = Object.assign(objData, { image: cloud.secure_url, imageId: cloud.public_id });
            }
            const updatedData = await Category.updateOne(
                { _id: req.params.id },
                {
                    $set: objData
                }
            );
            return res.json(updatedData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteCategory = async (req, res) => {
    try {
        // Check image & delete image
        const exist = await Category.findById(req.params.id);
        if (exist.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }

        const deletedData = await Category.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};