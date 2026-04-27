import multer from "multer";
import slugify from "slugify";
import mongoose from "mongoose";
import { cloudinary } from "../../lib/cloudinary.js";
import { imageUpload } from "../../lib/fileUpload.js";
import Blog from "../../models/article/article.js";

// GETTING ALL THE DATA
export const getAllBlog = async (req, res) => {
    try {
        const { page, perPage, search, author, sort } = req.query;
        let qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                title: { $regex: search, $options: "i" },
            };
        }
        if (author) {
            qMatch = {
                ...qMatch,
                author: author,
            };
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
                    path: "author",
                    select: "username fullname image description",
                },
            ],
        };
        const listofData = await Blog.find(qMatch).paginate(options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getBlogByAuthor = async (req, res) => {
    try {
        const { authorId } = req.params;
        const page = parseInt(req.query.page) || 1; // Halaman default adalah 1
        const limit = parseInt(req.query.limit) || 10; // Default limit adalah 10 artikel per halaman
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: { author: new mongoose.Types.ObjectId(String(authorId)), isActive: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "authorDetails",
                },
            },
            { $unwind: "$authorDetails" },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    image: 1,
                    spoiler: 1,
                    content: 1,
                    category: 1,
                    views: 1,
                    isActive: 1,
                    date: 1,
                    author: "$authorDetails",
                },
            },
            { $skip: skip },
            { $limit: limit },
        ];

        const blogs = await Blog.aggregate(pipeline);

        const totalDocuments = await Blog.countDocuments({
            author: new mongoose.Types.ObjectId(String(authorId)),
            isActive: true,
        });

        return res.json({
            author: blogs.length > 0 ? blogs[0].author : null,
            articles: blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalDocuments / limit),
                totalArticles: totalDocuments,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getRelatedArticles = async (req, res) => {
    try {
        const { category, exclude, limit } = req.query;

        let qMatch = { isActive: { $eq: true } };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (exclude) {
            qMatch.slug = { $ne: exclude };
        }
        if (category) {
            const categories = category.split(",").map((cat) => cat.trim());
            qMatch.category = { $in: categories };
        }

        const relatedArticles = await Blog.find(qMatch)
            .populate("author")
            .sort({ createdAt: -1 })
            .limit(limit ? Number(limit) : 3);

        return res.json(relatedArticles);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING AVAILABLE DATA
export const getAvailableBlog = async (req, res) => {
    try {
        const { page, perPage, search, exclude, category, lang, sort } = req.query;
        let qMatch = { isActive: { $eq: true } };

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                title: { $regex: search, $options: "i" },
            };
        }
        if (exclude) {
            qMatch.slug = { $ne: exclude };
        }
        if (category) {
            const categories = category.split(",").map((cat) => cat.trim());
            qMatch.category = { $in: categories };
        }
        if (lang === "en") {
            qMatch.contentEN = { $exists: true, $nin: [null, ""] };
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
                    path: "author",
                    select: "username fullname image description",
                },
            ],
        };
        const listofData = await Blog.find(qMatch).paginate(options);

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING TOP AVAILABLE DATA
export const getTopAvailableBlog = async (req, res) => {
    try {
        const { page, perPage, search, exclude, category } = req.query;
        let qMatch = { isActive: { $eq: true } };

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                title: { $regex: search, $options: "i" },
            };
        }
        if (exclude) {
            qMatch.slug = { $ne: exclude };
        }
        if (category) {
            qMatch.category = { $regex: category, $options: "i" };
        }
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { views: -1 },
            populate: [
                {
                    path: "author",
                    select: "username fullname image description",
                },
            ],
        };
        const listofData = await Blog.find(qMatch).paginate(options);

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET A SPECIFIC DATA
export const getBlogById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const specificData = await Blog.findOne(qMatch).populate("author");
        return res.json(specificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getBlogBySlug = async (req, res) => {
    try {
        let qMatch = { $or: [{ slug: req.params.slug }, { slugEN: req.params.slug }] };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const specificData = await Blog.findOne(qMatch).populate("author");

        return res.json(specificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addBlog = async (req, res) => {
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

            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
            }

            if (req.userData?.tenantRef) {
                objData.tenantRef = req.userData?.tenantRef;
            }

            if (objData.title) {
                let slug = slugify(objData.title, { lower: true, strict: true });

                const check = await Blog.find({ slug: { $regex: "^" + slug } });

                if (check.length > 0) {
                    slug = `${slug}-${check.length + 1}`;
                }

                objData.slug = slug;
            }

            if (objData.titleEN) {
                let slugEN = slugify(objData.titleEN, { lower: true, strict: true });

                const check = await Blog.find({ slugEN: { $regex: "^" + slugEN } });

                if (check.length > 0) {
                    slugEN = `${slugEN}-${check.length + 1}`;
                }

                objData.slugEN = slugEN;
            }

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

            const data = new Blog(objData);
            const newData = await data.save();
            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editBlog = async (req, res) => {
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

            let qMatch = { _id: req.params.id };
            if (req.userData?.tenantRef) {
                qMatch.tenantRef = req.userData?.tenantRef;
            }

            const exist = await Blog.findOne(qMatch);

            if (req.file) {
                // Chek & delete image
                if (exist.imageId) {
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

            const updatedData = await Blog.updateOne(qMatch, {
                $set: objData,
            });
            return res.json(updatedData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A VIEW DATA
export const editBlogView = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(404).json({ message: "Data not found!" });
        }

        const updatedData = await Blog.findOneAndUpdate({ _id: req.params.id }, { $inc: { views: 1 } }, { new: true });

        if (!updatedData) {
            return res.status(404).json({ message: "Data not found!" });
        }

        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteBlog = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        // Check image & delete image
        const exist = await Blog.findOne(qMatch);
        if (exist.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }
        const deletedData = await Blog.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
