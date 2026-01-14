import multer from "multer";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Subcategory from "../models/subcategory.js";
import { cloudinary, imageUpload } from "../lib/cloudinary.js";

// GETTING ALL THE DATA
export const getAllProduct = async (req, res) => {
    try {
        const { category, subcategory } = req.query;
        let query = {};

        if (category) {
            let categoryName = category.replace(":ne", "").trim();

            const categories = await Category.find({
                name: { $regex: categoryName, $options: "i" },
            });
            const filteredCategory = categories.map((item) => item._id);

            if (category.includes(":ne")) {
                query.category = { $nin: filteredCategory };
            } else {
                query.category = { $in: filteredCategory };
            }
        }

        if (subcategory) {
            let subName = subcategory.replace(":ne", "").trim();

            const subs = await Subcategory.find({
                name: { $regex: subName, $options: "i" },
            });
            const filteredSub = subs.map((item) => item._id);

            if (subcategory.includes(":ne")) {
                query.subcategory = { $nin: filteredSub };
            } else {
                query.subcategory = { $in: filteredSub };
            }
        }

        var d = new Date();
        var currDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const listofData = await Product.aggregate([
            { $match: query },
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
                    localField: "discount.promotion",
                    foreignField: "_id",
                    as: "promo",
                },
            },
            {
                $lookup: {
                    from: "promotionspecials",
                    localField: "discountSpecial.promotion",
                    foreignField: "_id",
                    as: "specialPromo",
                },
            },
            {
                $addFields: {
                    "discount.isAvailable": {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: [{ $arrayElemAt: ["$promo.isAvailable", 0] }, true] },
                                    { $gt: ["$discount.amount", 0] },
                                    { $lte: ["$discount.startDate", currDate] },
                                    {
                                        $or: [
                                            { $eq: ["$discount.endDate", null] },
                                            { $not: { $ifNull: ["$discount.endDate", false] } },
                                            { $gte: ["$discount.endDate", currDate] }
                                        ]
                                    }
                                ]
                            },
                            then: true,
                            else: false
                        }
                    },
                    // Tambahan nama
                    "discount.name": {
                        $arrayElemAt: ["$promo.name", 0]
                    }
                }
            },
            {
                $addFields: {
                    "discountSpecial.isAvailable": {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: [{ $arrayElemAt: ["$specialPromo.isAvailable", 0] }, true] },
                                    {
                                        $or: [
                                            { $gt: ["$discountSpecial.amount", 0] },
                                            { $gt: ["$discountSpecial.qtyMin", 0] }
                                        ]
                                    },
                                    { $lte: ["$discountSpecial.startDate", currDate] },
                                    {
                                        $or: [
                                            { $eq: ["$discountSpecial.endDate", null] },
                                            { $not: { $ifNull: ["$discountSpecial.endDate", false] } },
                                            { $gte: ["$discountSpecial.endDate", currDate] }
                                        ]
                                    },
                                    // Tambahkan kondisi untuk mencocokkan hari
                                    { $eq: ["$discountSpecial.selectedDay", { $dayOfWeek: currDate }] },
                                    // { $in: [{ $dayOfWeek: currDate }, "$discountSpecial.selectedDay"] }, // jika array
                                ]
                            },
                            then: true,
                            else: false
                        }
                    },
                    // Tambahan nama
                    "discountSpecial.name": {
                        $arrayElemAt: ["$specialPromo.name", 0]
                    }
                }
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ["$category", 0] },
                    subcategory: { $arrayElemAt: ["$subcategory", 0] }
                }
            },
            {
                $sort: {
                    "isRecommended": -1,
                    "listNumber": 1,
                    "name": 1,
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
                        name: "$category.name"
                    },
                    subcategory: {
                        _id: "$subcategory._id",
                        name: "$subcategory.name"
                    },
                    discount: {
                        name: {
                            $cond: {
                                if: { $eq: ["$discountSpecial.isAvailable", true] },
                                then: "$discountSpecial.name",
                                else: "$discount.name"
                            }
                        },
                        amount: {
                            $cond: {
                                if: { $eq: ["$discountSpecial.isAvailable", true] },
                                then: "$discountSpecial.amount",
                                else: "$discount.amount"
                            }
                        },
                        qtyMin: {
                            $cond: {
                                if: { $eq: ["$discountSpecial.isAvailable", true] },
                                then: "$discountSpecial.qtyMin",
                                else: { $literal: 0 }
                            }
                        },
                        qtyFree: {
                            $cond: {
                                if: { $eq: ["$discountSpecial.isAvailable", true] },
                                then: "$discountSpecial.qtyFree",
                                else: { $literal: 0 }
                            }
                        },
                        isDailyPromotion: {
                            $cond: {
                                if: { $or: ["$discountSpecial.isAvailable", "$discount.isAvailable"] },
                                then: true,
                                else: false
                            }
                        },
                        isAvailable: {
                            $cond: {
                                if: { $eq: ["$discountSpecial.isAvailable", true] },
                                then: { $literal: true },
                                else: "$discount.isAvailable"
                            }
                        }
                    },
                    // discount: {
                    //     amount: 1,
                    //     isAvailable: 1,
                    // },
                    // discountSpecial: {
                    //     amount: 1,
                    //     selectedDay: 1,
                    //     isAvailable: 1,
                    // },
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
                                                                $eq: ["$$variantDetail._id", "$$variantItem.variantRef"]
                                                            }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            _id: "$$variantDetailsFiltered._id",
                                            name: "$$variantDetailsFiltered.name",
                                            options: "$$variantDetailsFiltered.options"
                                            // Explicitly avoid projecting date or any other unnecessary fields
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            },
        ]);

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING ALL THE DATA
export const getPaginateProduct = async (req, res) => {
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
            populate: [
                {
                    path: "category",
                    select: ["name"],
                },
                {
                    path: "subcategory",
                    select: ["name"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
        }
        const listofData = await Product.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const spesificData = await Product.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addProduct = async (req, res) => {
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

            if (req.body.variantString) {
                const objVariant = {
                    variant: JSON.parse(req.body.variantString)
                }
                objData = Object.assign(objData, objVariant);
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

            const data = new Product(objData);
            const newData = await data.save();
            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editProduct = async (req, res) => {
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

            if (req.body.variantString) {
                const objVariant = {
                    variant: JSON.parse(req.body.variantString)
                }
                objData = Object.assign(objData, objVariant);
            }

            if (req.file) {
                // Chek product image & delete image
                const productExist = await Product.findById(req.params.id);
                if (productExist.imageId) {
                    await cloudinary.uploader.destroy(productExist.imageId);
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


            const updatedData = await Product.updateOne(
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
export const deleteProduct = async (req, res) => {
    try {
        // Check image & delete image
        const exist = await Product.findById(req.params.id);
        if (exist.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }

        const deletedData = await Product.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};