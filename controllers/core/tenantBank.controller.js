import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import Bank from "../../models/core/tenantBank.js";
import Tenant from "../../models/core/tenant.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { errorResponse } from "../../utils/errorResponse.js";

const uploadImage = async (file) => {
    const result = await cloudinary.uploader.upload(file.path, {
        folder: process.env.FOLDER_MAIN,
        format: "webp",
        transformation: [{ quality: "auto:low" }],
    });

    fs.unlink(file.path, () => {});

    return {
        image: result.secure_url,
        imageId: result.public_id,
    };
};

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort, outlet, status } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (search) {
            const objectId = mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.createFromHexString(search) : null;

            const tenants = await Tenant.find({
                $or: [
                    { tenantId: { $regex: search, $options: "i" } },
                    { ownerName: { $regex: search, $options: "i" } },
                    { businessName: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            });
            const filteredTenant = tenants.map((item) => item._id);

            qMatch = {
                ...qMatch,
                $or: [
                    ...(objectId ? [{ _id: objectId }] : []),
                    { bankName: { $regex: search, $options: "i" } },
                    { accountNumber: { $regex: search, $options: "i" } },
                    { accountHolderName: { $regex: search, $options: "i" } },
                    { tenantRef: { $in: filteredTenant } },
                ],
            };
        }

        if (outlet && mongoose.Types.ObjectId.isValid(outlet)) {
            qMatch.outletRef = outlet;
        }

        if (status === "active") {
            qMatch.isActive = { $eq: true };
        }

        if (["inactive", "nonactive", "notactive"].includes(status)) {
            qMatch.isActive = { $ne: true };
        }

        let sortObj = { createdAt: -1 }; // default
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
            populate: [
                {
                    path: "tenantRef",
                    select: "tenantId ownerName businessName phone email",
                },
            ],
        };
        const listofData = await Bank.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getDataById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const spesificData = await Bank.findOne(qMatch)
            .populate([
                {
                    path: "tenantRef",
                    select: "tenantId ownerName businessName phone email",
                },
            ])
            .lean();
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// CREATE NEW DATA
export const addData = async (req, res) => {
    imageUpload.fields([
        { name: "imageAccount", maxCount: 1 },
        { name: "imageHolder", maxCount: 1 },
    ])(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: "Failed",
                message: "Failed to upload image",
            });
        } else if (err) {
            return res.status(400).json({
                status: "Failed",
                message: err.message,
            });
        }

        try {
            let objData = req.body;
            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
                if (
                    req.userData?.outletRef &&
                    (objData.outletRef === undefined ||
                        objData.outletRef === null ||
                        (Array.isArray(objData.outletRef) && objData.outletRef.length === 0))
                ) {
                    objData.outletRef = Array.isArray(req.userData.outletRef) ? req.userData.outletRef : [req.userData.outletRef];
                }
            }

            if (req.files) {
                // if (req.files["imageAccount"]) {
                //     const image = req.files["imageAccount"][0];
                //     const cloud = await cloudinary.uploader.upload(image.path, {
                //         folder: process.env.FOLDER_MAIN,
                //         format: "webp",
                //         transformation: [{ quality: "auto:low" }],
                //     });
                //     objData.imageAccount = {
                //         image: cloud.secure_url,
                //         imageId: cloud.public_id,
                //     };
                // }
                // if (req.files["imageHolder"]) {
                //     const image = req.files["imageHolder"][0];
                //     const cloud = await cloudinary.uploader.upload(image.path, {
                //         folder: process.env.FOLDER_MAIN,
                //         format: "webp",
                //         transformation: [{ quality: "auto:low" }],
                //     });
                //     objData.imageHolder = {
                //         image: cloud.secure_url,
                //         imageId: cloud.public_id,
                //     };
                // }

                try {
                    const tasks = [];

                    if (req.files.imageAccount?.[0]) {
                        tasks.push(uploadImage(req.files.imageAccount[0]).then((result) => (objData.imageAccount = result)));
                    }

                    if (req.files.imageHolder?.[0]) {
                        tasks.push(uploadImage(req.files.imageHolder[0]).then((result) => (objData.imageHolder = result)));
                    }

                    await Promise.all(tasks);
                } catch (uploadErr) {
                    return res.status(400).json({
                        status: "Failed",
                        message: "Image upload failed",
                    });
                }
            }

            const data = new Bank(objData);
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
                    errors,
                });
            }

            return errorResponse(res, {
                statusCode: 500,
                code: "SERVER_ERROR",
                message: err.message || "Terjadi kesalahan pada server",
            });
        }
    });
};

// UPDATE A SPECIFIC DATA
export const editData = async (req, res) => {
    imageUpload.fields([
        { name: "imageAccount", maxCount: 1 },
        { name: "imageHolder", maxCount: 1 },
    ])(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: "Failed",
                message: "Failed to upload image",
            });
        } else if (err) {
            return res.status(400).json({
                status: "Failed",
                message: err.message,
            });
        }

        try {
            let qMatch = { _id: req.params.id };
            if (req.userData) {
                qMatch.tenantRef = req.userData?.tenantRef;
            }
            let objData = req.body;

            const spesificData = await Bank.findOne(qMatch).lean();

            if (!spesificData) return res.json({ status: 404, message: "Data not found!" });

            if (req.files) {
                try {
                    const tasks = [];

                    if (req.files.imageAccount?.[0]) {
                        // Remove old image from cloudinary if exists
                        if (spesificData?.imageAccount?.imageId) {
                            tasks.push(cloudinary.uploader.destroy(spesificData?.imageAccount?.imageId));
                        }
                        tasks.push(uploadImage(req.files.imageAccount[0]).then((result) => (objData.imageAccount = result)));
                    }

                    if (req.files.imageHolder?.[0]) {
                        // Remove old image from cloudinary if exists
                        if (spesificData?.imageHolder?.imageId) {
                            tasks.push(cloudinary.uploader.destroy(spesificData?.imageHolder?.imageId));
                        }
                        tasks.push(uploadImage(req.files.imageHolder[0]).then((result) => (objData.imageHolder = result)));
                    }

                    await Promise.all(tasks);
                } catch (uploadErr) {
                    return res.status(400).json({
                        status: "Failed",
                        message: "Image upload failed",
                    });
                }
            }

            const updatedData = await Bank.updateOne(qMatch, {
                $set: objData,
            });
            return res.json(updatedData);
        } catch (err) {
            return errorResponse(res, {
                statusCode: 500,
                code: "SERVER_ERROR",
                message: err.message || "Terjadi kesalahan pada server",
            });
        }
    });
};

// DELETE A SPECIFIC DATA
export const deleteData = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const existData = await Bank.findOne(qMatch).lean();

        if (!existData) {
            return errorResponse(res, {
                statusCode: 404,
                code: "DATA_NOT_FOUND",
                message: "Data not found!",
            });
        }

        const tasks = [];

        if (existData?.imageAccount?.imageId) {
            tasks.push(cloudinary.uploader.destroy(existData?.imageAccount?.imageId));
        }

        tasks.push(Bank.deleteOne(qMatch));

        const [, deletedData] = await Promise.all(tasks);

        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
