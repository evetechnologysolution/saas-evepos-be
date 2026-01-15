import multer from "multer";
import Category from "../../models/library/category.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllCategory = async (req, res) => {
    try {
        let query = {};

        if (req.userData) {
            query.tenantRef = req.userData?.tenantRef;
            query.outletRef = req.userData?.outletRef;
        }

        const listofData = await Category.find(query).sort({ "listNumber": 1 });
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// GETTING ALL THE DATA
export const getPaginateCategory = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let query = {};

        if (req.userData) {
            query.tenantRef = req.userData?.tenantRef;
            query.outletRef = req.userData?.outletRef;
        }

        if (search) {
            query = {
                ...query,
                name: { $regex: search, $options: 'i' }, // option i for case insensitivity to match upper and lower cases.
            };
        };

        let sortObj = { name: 1 }; // default
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
        }
        const listofData = await Category.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const spesificData = await Category.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// CREATE NEW DATA
export const addCategory = async (req, res) => {
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

        try {
            let objData = req.body;
            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
                if (req.userData?.outletRef) {
                    objData.outletRef = [req.userData.outletRef];
                }
            }

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

        } catch (err) {
            if (err.name === "ValidationError") {
                const errors = {};
                Object.keys(err.errors).forEach((key) => {
                    errors[key] = err.errors[key].message;
                });

                return errorResponse(res, {
                    code: "VALIDATION_ERROR",
                    message: "Validasi gagal",
                    errors
                });
            }

            return errorResponse(res, {
                statusCode: 500,
                code: "SERVER_ERROR",
                message: err.message || "Terjadi kesalahan pada server"
            });
        }
    });
};

// UPDATE A SPECIFIC DATA
export const editCategory = async (req, res) => {
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

        try {
            let objData = req.body;

            if (req.file) {
                // Chek image & delete image
                const exist = await Category.findById(req.params.id);
                if (exist?.imageId) {
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
        } catch (err) {
            return errorResponse(res, {
                statusCode: 500,
                code: "SERVER_ERROR",
                message: err.message || "Terjadi kesalahan pada server"
            });
        }
    });
};

// DELETE A SPECIFIC DATA
export const deleteCategory = async (req, res) => {
    try {
        // Check image & delete image
        const exist = await Category.findById(req.params.id);
        if (exist?.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }

        const deletedData = await Category.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};