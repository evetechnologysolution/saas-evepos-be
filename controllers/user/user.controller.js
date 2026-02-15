import bcrypt from "bcrypt";
import multer from "multer";
import User from "../../models/core/user.js";
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
export const getAllUser = async (req, res) => {
    try {
        const { page, perPage, search, status, role, sort } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { userId: { $regex: search, $options: "i" } },
                    { username: { $regex: search, $options: "i" } },
                    { fullname: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }

        if (status === "active") {
            qMatch = {
                ...qMatch,
                isActive: { $eq: true },
            };
        }

        if (["inactive", "nonactive", "notactive"].includes(status)) {
            qMatch = {
                ...qMatch,
                isActive: { $ne: true },
            };
        }

        if (role) {
            qMatch.role = role;
        }

        let sortObj = { fullname: 1 }; // default
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
            select: "-password",
            sort: sortObj,
        };
        const listofData = await User.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const spesificData = await User.findById(req.params.id);
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
export const addUser = async (req, res) => {
    imageUpload.fields([
        { name: "image", maxCount: 1 },
        { name: "imageKtp", maxCount: 1 },
        { name: "imageNpwp", maxCount: 1 },
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
                objData.outletRef = req.userData?.outletRef;
            }

            // Check user
            const userExist = await User.findOne({ username: objData.username }).lean();
            if (userExist) return res.json({ status: 400, message: "Username already exists" });

            // Hash password
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                objData = Object.assign(objData, { password: hashedPassword });
            }

            if (req.files) {
                try {
                    const tasks = [];

                    if (req.files.image?.[0]) {
                        tasks.push(
                            uploadImage(req.files.image[0]).then((uploaded) => {
                                objData.image = uploaded.image;
                                objData.imageId = uploaded.imageId;
                            }),
                        );
                    }

                    if (req.files.imageKtp?.[0]) {
                        tasks.push(
                            uploadImage(req.files.imageKtp[0]).then((uploaded) => {
                                objData.ktp = {
                                    ...objData.ktp,
                                    image: uploaded.image,
                                    imageId: uploaded.imageId,
                                };
                            }),
                        );
                    }

                    if (req.files.imageNpwp?.[0]) {
                        tasks.push(
                            uploadImage(req.files.imageNpwp[0]).then((uploaded) => {
                                objData.npwp = {
                                    ...objData.npwp,
                                    image: uploaded.image,
                                    imageId: uploaded.imageId,
                                };
                            }),
                        );
                    }

                    await Promise.all(tasks);
                } catch (uploadErr) {
                    return res.status(400).json({
                        status: "Failed",
                        message: "Image upload failed",
                    });
                }
            }

            const data = new User(objData);
            const newData = await data.save();
            const withoutPassword = newData.toObject();
            delete withoutPassword.password;
            return res.json(withoutPassword);
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
export const editUser = async (req, res) => {
    imageUpload.fields([
        { name: "image", maxCount: 1 },
        { name: "imageKtp", maxCount: 1 },
        { name: "imageNpwp", maxCount: 1 },
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
                // qMatch.outletRef = req.userData?.outletRef;
            }

            let objData = req.body;

            const spesificData = await User.findOne(qMatch).lean();

            // Check username
            const usernameExist = await User.findOne({ username: objData.username }).lean();
            if (objData.username !== spesificData.username && usernameExist)
                return res.json({ status: 400, message: "Username already exists" });

            if (objData.password) {
                if (objData.oldPassword) {
                    const validPassword = await bcrypt.compare(objData.oldPassword, spesificData.password);
                    if (!validPassword) return res.status(400).json({ message: "Old password incorrect" });
                }

                if (objData.confirmPassword) {
                    if (objData.confirmPassword !== objData.password) {
                        return res.status(400).json({ message: "Confirm password incorrect" });
                    }
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(objData.password, salt);
                const objPassword = {
                    password: hashedPassword,
                };
                objData = Object.assign(objData, objPassword);
            }

            if (req.files) {
                try {
                    const tasks = [];

                    if (req.files.image?.[0]) {
                        // Remove old image from cloudinary if exists
                        if (spesificData?.imageId) {
                            tasks.push(cloudinary.uploader.destroy(spesificData?.imageId));
                        }
                        tasks.push(
                            uploadImage(req.files.image[0]).then((uploaded) => {
                                objData.image = uploaded.image;
                                objData.imageId = uploaded.imageId;
                            }),
                        );
                    }

                    if (req.files.imageKtp?.[0]) {
                        // Remove old image from cloudinary if exists
                        if (spesificData?.ktp?.imageId) {
                            tasks.push(cloudinary.uploader.destroy(spesificData?.ktp?.imageId));
                        }
                        tasks.push(
                            uploadImage(req.files.imageKtp[0]).then((uploaded) => {
                                objData.ktp = {
                                    ...objData.ktp,
                                    image: uploaded.image,
                                    imageId: uploaded.imageId,
                                };
                            }),
                        );
                    }

                    if (req.files.imageNpwp?.[0]) {
                        // Remove old image from cloudinary if exists
                        if (spesificData?.npwp?.imageId) {
                            tasks.push(cloudinary.uploader.destroy(spesificData?.npwp?.imageId));
                        }
                        tasks.push(
                            uploadImage(req.files.imageNpwp[0]).then((uploaded) => {
                                objData.npwp = {
                                    ...objData.npwp,
                                    image: uploaded.image,
                                    imageId: uploaded.imageId,
                                };
                            }),
                        );
                    }

                    await Promise.all(tasks);
                } catch (uploadErr) {
                    return res.status(400).json({
                        status: "Failed",
                        message: "Image upload failed",
                    });
                }
            }

            const updatedData = await User.updateOne(qMatch, {
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

// UPDATE PASSWORD
export const changeUserPassword = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            // qMatch.outletRef = req.userData?.outletRef;
        }
        // Chek user
        const userExist = await User.findOne(qMatch).lean();
        if (!userExist) return res.status(400).json({ message: "User is not found" });

        if (req.body.oldPassword) {
            const validPassword = await bcrypt.compare(req.body.oldPassword, userExist.password);
            if (!validPassword) return res.status(400).json({ message: "Old password incorrect" });
        }

        if (req.body.confirmPassword) {
            if (req.body.confirmPassword !== req.body.password) {
                return res.status(400).json({ message: "Confirm password incorrect" });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const objPassword = {
            password: hashedPassword,
        };

        const updatedData = await User.updateOne(qMatch, {
            $set: objPassword,
        });
        return res.json(updatedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// DELETE A SPECIFIC DATA
export const deleteUser = async (req, res) => {
    try {
        const qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            // qMatch.outletRef = req.userData?.outletRef;
        }

        const existData = await User.findOne(qMatch);

        if (!existData) {
            return errorResponse(res, {
                statusCode: 404,
                code: "DATA_NOT_FOUND",
                message: "Data not found!",
            });
        }

        const tasks = [];

        // delete image (jika ada)
        if (existData.imageId) {
            tasks.push(cloudinary.uploader.destroy(existData.imageId));
        }
        if (existData?.ktp?.imageId) {
            tasks.push(cloudinary.uploader.destroy(existData?.ktp?.imageId));
        }
        if (existData?.npwp?.imageId) {
            tasks.push(cloudinary.uploader.destroy(existData?.npwp?.imageId));
        }

        // delete user
        tasks.push(User.deleteOne(qMatch));

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
