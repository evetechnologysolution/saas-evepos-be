import mongoose from "mongoose";
import multer from "multer";
import Promotion from "../../models/library/promotion.js";
import Variant from "../../models/library/variant.js";
import Category from "../../models/library/category.js";
import Product from "../../models/library/product.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllPromotion = async (req, res) => {
    try {
        const { page, perPage, search, promoType } = req.query;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
        };

        const matchQuery = {};

        if (req.userData?.tenantRef) {
            matchQuery.tenantRef = req.userData.tenantRef;
        }

        if (req.userData?.outletRef) {
            matchQuery.outletRef = {
                $in: Array.isArray(req.userData.outletRef) ? req.userData.outletRef : [req.userData.outletRef],
            };
        }

        if (search) {
            matchQuery.name = { $regex: search, $options: "i" };
        }

        if (promoType) {
            matchQuery.promoType = Number(promoType);
        }

        const pipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: "products",
                    localField: "products",
                    foreignField: "_id",
                    as: "products",
                },
            },
            { $sort: { date: -1 } },
            {
                $project: {
                    _id: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    promotionId: 1,
                    name: 1,
                    image: 1,
                    type: 1,
                    amount: 1,
                    qtyMin: 1,
                    qtyFree: 1,
                    startDate: 1,
                    endDate: 1,
                    validUntil: 1,
                    selectedDay: 1,
                    isAvailable: 1,
                    products: {
                        _id: 1,
                        name: 1,
                        price: 1,
                    },
                },
            },
        ];

        const myAggregate = Promotion.aggregate(pipeline);

        myAggregate.paginateExec(options, function (err, result) {
            if (err) {
                return res.json(err);
            }
            if (result) {
                return res.json(result);
            }
        });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING AVAILABLE THE DATA
export const getAvailablePromotion = async (req, res) => {
    try {
        var d = new Date();
        var currDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const matchQuery = {
            $and: [
                { isAvailable: true },
                { startDate: { $lte: currDate } },
                {
                    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: currDate } }],
                },
            ],
        };

        if (req.userData?.tenantRef) {
            matchQuery.tenantRef = req.userData.tenantRef;
        }

        if (req.userData?.outletRef) {
            matchQuery.outletRef = {
                $in: Array.isArray(req.userData.outletRef) ? req.userData.outletRef : [req.userData.outletRef],
            };
        }

        Promotion.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: "products",
                    localField: "products",
                    foreignField: "_id",
                    as: "products",
                },
            },
            { $sort: { startDate: -1, date: -1 } },
            {
                $project: {
                    _id: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    promotionId: 1,
                    name: 1,
                    type: 1,
                    amount: 1,
                    qtyMin: 1,
                    qtyFree: 1,
                    image: 1,
                    selectedDay: 1,
                    products: {
                        _id: 1,
                        name: 1,
                        image: 1,
                        price: 1,
                        productionPrice: 1,
                        category: 1,
                        unit: 1,
                        description: 1,
                        amountKg: 1,
                        extraNotes: 1,
                        variant: 1,
                        isRecommended: 1,
                        isAvailable: 1,
                    },
                },
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                async function getData() {
                    try {
                        const data = await Promise.all(
                            result.map(async (field) => {
                                const products = await Promise.all(
                                    field.products.map(async (item) => {
                                        const variants = await Promise.all(
                                            item.variant.map(async (row, index) => {
                                                const check = await Variant.findById(row.variantRef).select("_id name options");
                                                delete row.variantRef;
                                                return {
                                                    ...row,
                                                    variantRef: check,
                                                };
                                            }),
                                        );

                                        const cate = await Category.findById(item.category).select("_id name");

                                        return {
                                            ...item,
                                            variant: variants,
                                            category: {
                                                _id: cate._id,
                                                name: cate.name,
                                            },
                                        };
                                    }),
                                );

                                // Sort products by isRecommended first and then by name
                                const sortedProducts = products.sort((a, b) => {
                                    // Sort by isRecommended first
                                    if (b.isRecommended !== a.isRecommended) {
                                        return b.isRecommended - a.isRecommended;
                                    }
                                    // If isRecommended is the same, sort by name alphabetically
                                    return a.name.localeCompare(b.name);
                                });

                                return { ...field, products: sortedProducts };
                            }),
                        );
                        return res.json(data);
                    } catch (error) {
                        // console.error("Error:", error);
                        return res.status(500).json({ message: "Internal Server Error" });
                    }
                }

                return getData();
            }
        });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getPromotionById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Promotion.findOne(qMatch).lean();
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
export const addPromotion = async (req, res) => {
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
            // Generate new ObjectId for _id
            const newObjectId = new mongoose.Types.ObjectId();
            const objData = {
                ...req.body,
                _id: newObjectId,
            };

            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
                if (req.userData?.outletRef) {
                    objData.outletRef = [req.userData.outletRef];
                }
            }

            let convertId = [];
            if (req.body.products) {
                convertId = typeof req.body.products === "string" ? JSON.parse(req.body.products) : req.body.products;
                objData.products = convertId;
            }

            if (objData.startDate) {
                const now = new Date(objData.startDate);
                objData.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            if (objData.endDate) {
                const now = new Date(objData.endDate);
                objData.endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            // Prepare bulk operations for updating products
            const bulkOps = [];
            if (convertId.length > 0) {
                // discount 1 or bundle 3
                if (Number(objData.type) === 1 || Number(objData.type) === 3) {
                    for (const prodId of convertId) {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: prodId },
                                update: { $set: { promotionRef: newObjectId } },
                            },
                        });
                    }
                }
            }

            // Execute bulk operations if any
            if (bulkOps.length > 0) {
                await Product.bulkWrite(bulkOps);
            }

            // Handle image upload
            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData.image = cloud.secure_url;
                objData.imageId = cloud.public_id;
            }

            const data = new Promotion(objData);
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
export const editPromotion = async (req, res) => {
    imageUpload.single("image")(req, res, async (err) => {
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
            let qMatch = { _id: req.params.id };
            if (req.userData) {
                qMatch.tenantRef = req.userData?.tenantRef;
                qMatch.outletRef = req.userData?.outletRef;
            }
            // Check if the promotion exists
            const exist = await Promotion.findOne(qMatch).lean();
            if (!exist) {
                return res.status(400).json({ message: "Data not found" });
            }

            const objData = req.body;

            let convertId = [];
            if (req.body.products) {
                convertId = typeof req.body.products === "string" ? JSON.parse(req.body.products) : req.body.products;
                objData.products = convertId;
            }

            // Determine products to remove or update
            const productRemove = [
                ...exist.products.filter((item) => !convertId.includes(item)),
                ...convertId.filter((item) => !exist.products.includes(item)),
            ];

            if (objData.startDate) {
                const now = new Date(objData.startDate);
                objData.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            if (objData.endDate) {
                const now = new Date(objData.endDate);
                objData.endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            // Prepare bulk operations
            const bulkOps = [];

            if (productRemove.length > 0 && Number(exist.type) === 1) {
                productRemove.forEach((prodId) => {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: prodId, promotionRef: req.params.id },
                            update: {
                                $set: { promotionRef: null },
                            },
                        },
                    });
                });
            }

            if (convertId.length > 0) {
                // discount 1 or bundle 3
                if (Number(objData.type) === 1 || Number(objData.type) === 3) {
                    for (const prodId of convertId) {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: prodId },
                                update: { $set: { promotionRef: req.params.id } },
                            },
                        });
                    }
                }
            }

            // Execute bulk operations if there are any
            if (bulkOps.length > 0) {
                await Product.bulkWrite(bulkOps);
            }

            // Handle image upload and delete old image if necessary
            if (req.file) {
                if (exist?.imageId) {
                    await cloudinary.uploader.destroy(exist.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [{ width: 800, height: 800, crop: "fit" }, { quality: "auto:low" }],
                });

                objData.image = cloud.secure_url;
                objData.imageId = cloud.public_id;
            }

            // Update the promotion with new data
            const updatedData = await Promotion.findOneAndUpdate(qMatch, { $set: objData }, { new: true });
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
export const deletePromotion = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        // Check image & delete image
        const exist = await Promotion.findOne(qMatch).lean();
        if (!exist) {
            return res.status(404).json({ message: "Promotion not found" });
        }

        if (exist?.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }

        // Prepare bulk operations for updating products
        const bulkOps = [];
        if (exist.products.length > 0 && Number(exist.type) === 1) {
            for (const prodId of exist.products) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: prodId, promotionRef: req.params.id },
                        update: {
                            $set: { promotionRef: null },
                        },
                    },
                });
            }
        }

        // Execute bulk operations if any
        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        // Delete the promotion
        const deletedData = await Promotion.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
