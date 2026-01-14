import multer from "multer";
import Voucher from "../models/voucher.js";
import Product from "../models/library/product.js";
import Member from "../models/member.js";
import MemberVoucher from "../models/voucherMember.js";
import { cloudinary, imageUpload } from "../lib/cloudinary.js";
import { adjustPointHistories, createPointHistory } from "../lib/handlePoint.js";
import { generateVoucherCode } from "../lib/generateRandom.js";

// GETTING ALL THE DATA
export const getAllVoucher = async (req, res) => {
    try {
        const { page, perPage, search, voucherType } = req.query;
        let query = {};

        if (voucherType) {
            query.voucherType = Number(voucherType);
        }

        if (search) {
            const prod = await Product.find({
                name: { $regex: search, $options: "i" },
            });
            const filteredProd = prod.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { product: { $in: filteredProd } }
                ]
            };
        };

        const options = {
            populate: [
                {
                    path: "product",
                    select: ["name", "price"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        }
        const listofData = await Voucher.paginate(query, options);

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING AVAILABE DATA
export const getAllAvailableVoucher = async (req, res) => {
    try {
        const { page, perPage, search, voucherType } = req.query;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let query = {
            start: { $lte: today },
            end: { $gte: today },
            isAvailable: { $eq: true }
        };

        if (voucherType) {
            query.voucherType = Number(voucherType);
        }

        if (search) {
            const prod = await Product.find({
                name: { $regex: search, $options: "i" },
            });
            const filteredProd = prod.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { product: { $in: filteredProd } }
                ]
            };
        };

        const options = {
            populate: [
                {
                    path: "product",
                    select: ["name", "price"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        }
        const listofData = await Voucher.paginate(query, options);

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getVoucherById = async (req, res) => {
    try {
        const spesificData = await Voucher.findById(req.params.id)
            .populate([
                {
                    path: "product",
                    select: ["name", "price"],
                },
            ]);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const redeemVoucher = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (!req.body.voucher || !req.body.member) {
            return res.status(404).json({ message: "Key voucher and member is required!" });
        }

        const checkVoucher = await Voucher.findOne({
            _id: req.body.voucher,
            start: { $lte: today },
            end: { $gte: today },
            isAvailable: { $eq: true }
        });
        if (!checkVoucher) {
            return res.status(404).json({ message: "Voucher not found!" });
        }

        const checkMember = await Member.findById(req.body.member);
        if (!checkMember) {
            return res.status(404).json({ message: "Member not found!" });
        }

        if (checkVoucher.worthPoint > checkMember.point) {
            return res.status(400).json({ message: "Poin tidak mencukupi!" });
        }

        // Kurangi poin member
        await Member.findOneAndUpdate(
            { _id: checkMember._id },
            { $inc: { point: -Number(checkVoucher.worthPoint) } },
            { new: true, upsert: false }
        );

        // Kurangi poin yang masih bisa digunakan 
        await adjustPointHistories(checkMember._id, checkVoucher.worthPoint, "", "reduce");

        // Buat riwayat poin
        await createPointHistory(checkMember._id, "", checkVoucher.worthPoint, "out");

        const randCode = await generateVoucherCode(16);

        const newObj = new MemberVoucher({
            voucherCode: randCode,
            voucherRef: checkVoucher._id,
            member: checkMember._id,
            name: checkVoucher.name,
            image: checkVoucher.image,
            description: checkVoucher.description,
            voucherType: checkVoucher.voucherType,
            product: checkVoucher.product,
            qtyProduct: checkVoucher.qtyProduct
        });
        const newData = await newObj.save();

        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addVoucher = async (req, res) => {
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

            if (objData.start) {
                const now = new Date(objData.start);
                objData.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            if (objData.end) {
                const now = new Date(objData.end);
                objData.end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 400, height: 400, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" } // Adjust the compression level if desired
                    ]
                });
                objData = Object.assign(objData, { image: cloud.secure_url, imageId: cloud.public_id });
            }

            const data = new Voucher(objData);
            const newData = await data.save();
            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editVoucher = async (req, res) => {
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

            if (objData.start) {
                const now = new Date(objData.start);
                objData.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            if (objData.end) {
                const now = new Date(objData.end);
                objData.end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            if (objData.product === "reset") {
                objData.product = null;
            }

            if (req.file) {
                // Chek image & delete image
                const check = await Voucher.findById(req.params.id);
                if (check.imageId) {
                    await cloudinary.uploader.destroy(check.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { width: 400, height: 400, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" } // Adjust the compression level if desired
                    ]
                });
                objData = Object.assign(objData, { image: cloud.secure_url, imageId: cloud.public_id });
            }


            const updatedData = await Voucher.updateOne(
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
export const deleteVoucher = async (req, res) => {
    try {
        // Check image & delete image
        const exist = await Voucher.findById(req.params.id);
        if (exist.imageId) {
            await cloudinary.uploader.destroy(exist.imageId);
        }

        const deletedData = await Voucher.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};