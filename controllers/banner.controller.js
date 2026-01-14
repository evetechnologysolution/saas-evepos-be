import multer from "multer";
import Banner from "../models/banner.js";
import { cloudinary, imageUpload, limitFileSize } from "../lib/cloudinary.js";

// GETTING ALL THE DATA
export const getAllBanner = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            query = {
                ...query,
                name: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
            };
        };
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        }
        const listofData = await Banner.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAvailableBanner = async (req, res) => {
    try {
        const listofData = await Banner.find()
            .select("-imageId -imageMobileId")
            .where("isAvailable")
            .equals(true)
            .sort({ "listNumber": 1 });
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET A SPECIFIC DATA
export const getBannerById = async (req, res) => {
    try {
        const spesificData = await Banner.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addBanner = async (req, res) => {
    try {
        imageUpload.fields([
            { name: "image", maxCount: 1 },
            { name: "imageMobile", maxCount: 1 }
        ])(req, res, async function (err) {
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

            if (req.files) {
                // Process image
                if (req.files["image"]) {
                    const image = req.files["image"][0];
                    if (image.size <= limitFileSize) {
                        const cloudImage = await cloudinary.uploader.upload(image.path, {
                            folder: process.env.FOLDER_MAIN,
                            format: "webp",
                            transformation: [
                                { quality: "auto:low" }
                            ]
                        });
                        objData = Object.assign(objData, { image: cloudImage.secure_url, imageId: cloudImage.public_id });
                    }
                }

                if (req.files["imageMobile"]) {
                    const imgMobile = req.files["imageMobile"][0];
                    if (imgMobile.size <= limitFileSize) {
                        const cloudMobile = await cloudinary.uploader.upload(imgMobile.path, {
                            folder: process.env.FOLDER_MAIN,
                            format: "webp",
                            transformation: [
                                { quality: "auto:low" }
                            ]
                        });
                        objData = Object.assign(objData, { imageMobile: cloudMobile.secure_url, imageMobileId: cloudMobile.public_id });
                    }
                }
            }

            const data = new Banner(objData);
            const newData = await data.save();
            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editBanner = async (req, res) => {
    try {
        imageUpload.fields([
            { name: "image", maxCount: 1 },
            { name: "imageMobile", maxCount: 1 }
        ])(req, res, async function (err) {
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

            const existing = await Banner.findById(req.params.id);

            let objData = req.body;

            if (req.files) {
                // Process image
                if (req.files["image"]) {
                    const image = req.files["image"][0];
                    if (image.size <= limitFileSize) {
                        if (existing.imageId) {
                            await cloudinary.uploader.destroy(existing.imageId);
                        }
                        const cloudImage = await cloudinary.uploader.upload(image.path, {
                            folder: process.env.FOLDER_MAIN,
                            format: "webp",
                            transformation: [
                                { quality: "auto:low" }
                            ]
                        });
                        objData = Object.assign(objData, { image: cloudImage.secure_url, imageId: cloudImage.public_id });
                    }
                }

                if (req.files["imageMobile"]) {
                    const imgMobile = req.files["imageMobile"][0];
                    if (imgMobile.size <= limitFileSize) {
                        if (existing.imageMobileId) {
                            await cloudinary.uploader.destroy(existing.imageMobileId);
                        }
                        const cloudMobile = await cloudinary.uploader.upload(imgMobile.path, {
                            folder: process.env.FOLDER_MAIN,
                            format: "webp",
                            transformation: [
                                { quality: "auto:low" }
                            ]
                        });
                        objData = Object.assign(objData, { imageMobile: cloudMobile.secure_url, imageMobileId: cloudMobile.public_id });
                    }
                }
            }

            const updatedData = await Banner.updateOne(
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
export const deleteBanner = async (req, res) => {
    try {
        // Chek product image & delete image
        const existData = await Banner.findById(req.params.id);
        if (existData.imageId) {
            await cloudinary.uploader.destroy(existData.imageId);
        }
        if (existData.imageMobileId) {
            await cloudinary.uploader.destroy(existData.imageMobileId);
        }

        const deletedData = await Banner.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};