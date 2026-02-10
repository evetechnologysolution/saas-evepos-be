import multer from "multer";
import Product from "../../models/library/product.js";
import Category from "../../models/library/category.js";
import Subcategory from "../../models/library/subcategory.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllRawProduct = async (req, res) => {
    try {
        const { category, subcategory } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (category) {
            let categoryName = category.replace(":ne", "").trim();

            const categories = await Category.find({
                name: { $regex: categoryName, $options: "i" },
            });
            const filteredCategory = categories.map((item) => item._id);

            if (category.includes(":ne")) {
                qMatch.category = { $nin: filteredCategory };
            } else {
                qMatch.category = { $in: filteredCategory };
            }
        }

        if (subcategory) {
            let subName = subcategory.replace(":ne", "").trim();

            const subs = await Subcategory.find({
                name: { $regex: subName, $options: "i" },
            });
            const filteredSub = subs.map((item) => item._id);

            if (subcategory.includes(":ne")) {
                qMatch.subcategory = { $nin: filteredSub };
            } else {
                qMatch.subcategory = { $in: filteredSub };
            }
        }

        var d = new Date();
        var currDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const listofData = await Product.aggregate([
            { $match: qMatch },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subcategory",
                    foreignField: "_id",
                    as: "subcategory",
                },
            },
            {
                $lookup: {
                    from: "variants",
                    localField: "variant.variantRef",
                    foreignField: "_id",
                    as: "variantDetails",
                },
            },
            {
                $lookup: {
                    from: "promotions",
                    localField: "promotionRef",
                    foreignField: "_id",
                    as: "promoRef",
                },
            },
            {
                $addFields: {
                    promo: { $arrayElemAt: ["$promoRef", 0] },
                },
            },
            {
                $addFields: {
                    "discount.isAvailable": {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: ["$promo.isAvailable", true] },
                                    { $or: [{ $gt: ["$promo.amount", 0] }, { $gt: ["$promo.qtyMin", 0] }] },
                                    { $lte: ["$promo.startDate", currDate] },
                                    {
                                        $or: [
                                            { $eq: ["$promo.endDate", null] },
                                            { $not: { $ifNull: ["$promo.endDate", false] } },
                                            { $gte: ["$promo.endDate", currDate] },
                                        ],
                                    },
                                    // Tambahkan kondisi untuk mencocokkan hari
                                    {
                                        $or: [
                                            // setiap hari (null atau [])
                                            {
                                                $or: [
                                                    { $eq: ["$promo.selectedDay", null] },
                                                    {
                                                        $and: [
                                                            { $isArray: "$promo.selectedDay" },
                                                            { $eq: [{ $size: "$promo.selectedDay" }, 0] },
                                                        ],
                                                    },
                                                ],
                                            },
                                            // hari tertentu
                                            {
                                                $and: [
                                                    { $isArray: "$promo.selectedDay" },
                                                    { $gt: [{ $size: "$promo.selectedDay" }, 0] },
                                                    { $in: [{ $dayOfWeek: currDate }, "$promo.selectedDay"] },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ["$category", 0] },
                    subcategory: { $arrayElemAt: ["$subcategory", 0] },
                },
            },
            {
                $sort: {
                    isRecommended: -1,
                    listNumber: 1,
                    name: 1,
                },
            },
            {
                $project: {
                    _id: 1,
                    date: 1,
                    name: 1,
                    image: 1,
                    price: 1,
                    productionPrice: 1,
                    productionNotes: 1,
                    description: 1,
                    unit: 1,
                    listNumber: 1,
                    amountKg: 1,
                    isLaundryBag: 1,
                    extraNotes: 1,
                    isRecommended: 1,
                    isAvailable: 1,
                    category: {
                        _id: "$category._id",
                        name: "$category.name",
                    },
                    subcategory: {
                        _id: "$subcategory._id",
                        name: "$subcategory.name",
                    },
                    discount: {
                        name: "$promo.name",
                        amount: "$promo.amount",
                        qtyMin: "$promo.qtyMin",
                        qtyFree: "$promo.qtyFree",
                        isDailyPromotion: "$discount.isAvailable",
                        isAvailable: "$discount.isAvailable",
                    },
                    variant: {
                        $map: {
                            input: "$variant",
                            as: "variantItem",
                            in: {
                                isMandatory: "$$variantItem.isMandatory",
                                isMultiple: "$$variantItem.isMultiple",
                                variantRef: {
                                    $let: {
                                        vars: {
                                            variantDetailsFiltered: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$variantDetails",
                                                            as: "variantDetail",
                                                            cond: {
                                                                $eq: ["$$variantDetail._id", "$$variantItem.variantRef"],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            _id: "$$variantDetailsFiltered._id",
                                            name: "$$variantDetailsFiltered.name",
                                            options: "$$variantDetailsFiltered.options",
                                            // Explicitly avoid projecting date or any other unnecessary fields
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ]);

        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING ALL THE DATA
export const getAllProduct = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                name: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
            };
        }

        let sortObj = { name: 1 }; // default
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const options = {
            populate: [
                {
                    path: "category",
                    select: ["name"],
                },
                {
                    path: "subcategory",
                    select: ["name"],
                },
                {
                    path: "promotionRef",
                    select: "name type amount qtyMin qtyFree startDate endDate selectedDay isAvailable",
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
            lean: { virtuals: true },
        };
        const listofData = await Product.paginate(qMatch, options);

        // manipulasi promotionRef tapi discount tetap
        listofData.docs = listofData.docs.map(({ promotionRef, ...rest }) => ({
            ...rest,
            promotionRef: promotionRef?._id || null,
        }));

        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Product.findOne(qMatch).lean();
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
export const addProduct = async (req, res) => {
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
            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
                if (req.userData?.outletRef) {
                    objData.outletRef = [req.userData.outletRef];
                }
            }

            if (req.body.variantString) {
                const objVariant = {
                    variant: JSON.parse(req.body.variantString),
                };
                objData = Object.assign(objData, objVariant);
            }

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData = Object.assign(objData, {
                    image: cloud.secure_url,
                    imageId: cloud.public_id,
                });
            }

            const data = new Product(objData);
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
export const editProduct = async (req, res) => {
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
            let qMatch = { _id: req.params.id };
            if (req.userData) {
                qMatch.tenantRef = req.userData?.tenantRef;
                qMatch.outletRef = req.userData?.outletRef;
            }
            let objData = req.body;

            if (req.body.variantString) {
                const objVariant = {
                    variant: JSON.parse(req.body.variantString),
                };
                objData = Object.assign(objData, objVariant);
            }

            if (req.file) {
                // Chek product image & delete image
                const productExist = await Product.findOne(qMatch).lean();
                if (productExist.imageId) {
                    await cloudinary.uploader.destroy(productExist.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 800, height: 800, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData = Object.assign(objData, {
                    image: cloud.secure_url,
                    imageId: cloud.public_id,
                });
            }

            const updatedData = await Product.updateOne(qMatch, {
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
export const deleteProduct = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        // Check image & delete image
        const existData = await Product.findOne(qMatch).lean();

        if (!existData) {
            return errorResponse(res, {
                statusCode: 404,
                code: "DATA_NOT_FOUND",
                message: "Data not found!",
            });
        }

        const tasks = [];

        if (existData?.imageId) {
            tasks.push(cloudinary.uploader.destroy(existData?.imageId));
        }

        tasks.push(Product.deleteOne(qMatch));

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
