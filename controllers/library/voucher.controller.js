import multer from "multer";
import mongoose from "mongoose";
import Voucher from "../../models/library/voucher.js";
import Product from "../../models/library/product.js";
import Member from "../../models/member/member.js";
import MemberVoucher from "../../models/member/voucherMember.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { adjustPointHistories, createPointHistory } from "../../lib/handlePoint.js";
import { generateVoucherCode } from "../../lib/generateRandom.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllVoucher = async (req, res) => {
    try {
        const { page, perPage, search, voucherType, sort } = req.query;
        let qMatch = {};

        if (voucherType) {
            qMatch.voucherType = Number(voucherType);
        }

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            // qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            const prod = await Product.find({
                name: { $regex: search, $options: "i" },
            });
            const filteredProd = prod.map((item) => item._id);

            qMatch = {
                ...qMatch,
                $or: [{ name: { $regex: search, $options: "i" } }, { product: { $in: filteredProd } }],
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
            populate: [
                {
                    path: "product",
                    select: ["name", "price"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
        };
        const listofData = await Voucher.paginate(qMatch, options);

        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING AVAILABE DATA
export const getAllAvailableVoucher = async (req, res) => {
    try {
        const { page, perPage, search, voucherType, sort } = req.query;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let qMatch = {
            start: { $lte: today },
            end: { $gte: today },
            isAvailable: { $eq: true },
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            // qMatch.outletRef = req.userData?.outletRef;
        }

        if (voucherType) {
            qMatch.voucherType = Number(voucherType);
        }

        if (search) {
            const prod = await Product.find({
                name: { $regex: search, $options: "i" },
            });
            const filteredProd = prod.map((item) => item._id);

            qMatch = {
                ...qMatch,
                $or: [{ name: { $regex: search, $options: "i" } }, { product: { $in: filteredProd } }],
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
            populate: [
                {
                    path: "product",
                    select: ["name", "price"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
        };
        const listofData = await Voucher.paginate(qMatch, options);

        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getVoucherById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            // qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Voucher.findOne(qMatch).populate([
            {
                path: "product",
                select: ["name", "price"],
            },
        ]);
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const redeemVoucher = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (!req.body?.voucher || !req.body?.member) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Key voucher and member is required!" });
        }

        let qMatch = {
            _id: req.body.voucher,
            start: { $lte: today },
            end: { $gte: today },
            isAvailable: true,
        };

        let qMemberMatch = {
            _id: req.body.member,
        };

        // di sisi member, auth member
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData.tenantRef;
            qMemberMatch.tenantRef = req.userData.tenantRef;
        }

        const selectedTenant = req.body?.tenantRef || req.userData?.tenantRef;
        if (!selectedTenant) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "tenantRef wajib diisi!" });
        }

        const checkVoucher = await Voucher.findOne(qMatch).session(session);
        if (!checkVoucher) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Voucher not found!" });
        }

        const checkMember = await Member.findOne(qMemberMatch).session(session);
        if (!checkMember) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Member not found!" });
        }

        if (checkVoucher.worthPoint > checkMember.point) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Poin tidak mencukupi!" });
        }

        // Kurangi poin member
        await Member.findOneAndUpdate(
            qMemberMatch,
            { $inc: { point: -Number(checkVoucher.worthPoint) } },
            { new: true, upsert: false, session },
        );

        // Kurangi histori poin
        await adjustPointHistories(checkMember._id, req.userData?.tenantRef, checkVoucher.worthPoint, "", "reduce", session);

        // Buat riwayat poin
        await createPointHistory(checkMember._id, null, req.userData?.tenantRef, checkVoucher.worthPoint, "out", session);

        const randCode = await generateVoucherCode(16);

        const newObj = new MemberVoucher({
            voucherCode: randCode,
            voucherRef: checkVoucher._id,
            memberRef: checkMember._id,
            tenantRef: selectedTenant,
            name: checkVoucher.name,
            image: checkVoucher.image,
            description: checkVoucher.description,
            voucherType: checkVoucher.voucherType,
            product: checkVoucher.product,
            qtyProduct: checkVoucher.qtyProduct,
        });

        const newData = await newObj.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json(newData);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// CREATE NEW DATA
export const addVoucher = async (req, res) => {
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
            }

            if (objData.start) {
                const now = new Date(objData.start);
                objData.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            if (objData.end) {
                const now = new Date(objData.end);
                objData.end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            let convertId = [];
            if (req.body.product === "reset") {
                objData.product = null;
            } else if (req.body.product) {
                convertId = typeof req.body.product === "string" ? JSON.parse(req.body.product) : req.body.product;
                objData.product = convertId;
            }

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 400, height: 400, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData = Object.assign(objData, {
                    image: cloud.secure_url,
                    imageId: cloud.public_id,
                });
            }

            const data = new Voucher(objData);
            const newData = await data.save();
            return res.json(newData);
        } catch (err) {
            return errorResponse(res, {
                statusCode: 500,
                code: "SERVER_ERROR",
                message: err.message || "Terjadi kesalahan pada server",
            });
        }
    });
};

// UPDATE A SPECIFIC DATA
export const editVoucher = async (req, res) => {
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
            }

            let objData = req.body;

            if (objData.start) {
                const now = new Date(objData.start);
                objData.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            if (objData.end) {
                const now = new Date(objData.end);
                objData.end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            let convertId = [];
            if (req.body.product === "reset") {
                objData.product = null;
            } else if (req.body.product) {
                convertId = typeof req.body.product === "string" ? JSON.parse(req.body.product) : req.body.product;
                objData.product = convertId;
            }

            if (req.file) {
                // Chek image & delete image
                const check = await Voucher.findOne(qMatch).lean();
                if (check.imageId) {
                    await cloudinary.uploader.destroy(check.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 400, height: 400, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData = Object.assign(objData, {
                    image: cloud.secure_url,
                    imageId: cloud.public_id,
                });
            }

            const updatedData = await Voucher.updateOne(qMatch, {
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
export const deleteVoucher = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const existData = await Voucher.findOne(qMatch).lean();

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

        tasks.push(Voucher.deleteOne(qMatch));

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
