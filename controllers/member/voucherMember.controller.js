import mongoose from "mongoose";
import MemberVoucher from "../../models/member/voucherMember.js";
import MemberData from "../../models/member/member.js";
import Product from "../../models/library/product.js";

// GETTING ALL THE DATA
export const getAllVoucher = async (req, res) => {
    try {
        const {
            page,
            perPage,
            search,
            voucherType,
            status,
            member,
            sortBy,
            sortType,
        } = req.query;

        const today = new Date();

        const sortField = sortBy || "date";
        const sortDirection = sortType === "asc" ? 1 : -1;

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { [sortField]: sortDirection },
        };

        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (member) {
            qMatch.member = mongoose.Types.ObjectId(member);
        }

        if (voucherType) {
            qMatch.voucherType = Number(voucherType);
        }

        if (status) {
            if (status === "open") {
                qMatch.isUsed = { $ne: true };
                qMatch.expiry = { $gt: today };
            }
            if (status === "used") {
                qMatch.$and = [
                    {
                        $or: [
                            { isUsed: { $eq: true } },
                            { expiry: { $lt: today } },
                        ],
                    },
                ];
            }
            if (status === "used-log") {
                qMatch.isUsed = { $eq: true };
            }
            if (status === "expired") {
                qMatch.isUsed = { $ne: true };
                qMatch.expiry = { $lt: today };
            }
        }

        if (search) {
            const prod = await Product.find({
                name: { $regex: search, $options: "i" },
            }).select("_id");

            const mem = await MemberData.find({
                name: { $regex: search, $options: "i" },
            }).select("_id");

            const searchConditions = [
                { _id: { $regex: search, $options: "i" } },
                { voucherCode: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                {
                    product: {
                        $in: prod.map((item) =>
                            mongoose.Types.ObjectId(item._id),
                        ),
                    },
                },
                {
                    memberRef: {
                        $in: mem.map((item) =>
                            mongoose.Types.ObjectId(item._id),
                        ),
                    },
                },
            ];

            if (qMatch.$and && status === "used") {
                qMatch.$and.push({ $or: searchConditions });
            } else {
                qMatch.$or = searchConditions;
            }
        }

        const aggregationPipeline = [
            { $match: qMatch }, // Filter berdasarkan qMatch
            {
                $addFields: {
                    isExpired: {
                        $cond: {
                            if: { $lt: ["$expiry", today] },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $lookup: {
                    from: "members",
                    localField: "member",
                    foreignField: "_id",
                    as: "member",
                },
            },
            { $unwind: { path: "$memberRef", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    date: 1,
                    expiry: 1,
                    scanDate: 1,
                    usedAt: 1,
                    voucherCode: 1,
                    voucherRef: 1,
                    name: 1,
                    image: 1,
                    description: 1,
                    voucherType: 1,
                    qtyProduct: 1,
                    product: {
                        $cond: {
                            if: { $gt: [{ $size: "$product" }, 0] }, // Jika ada produk
                            then: {
                                $map: {
                                    input: "$product",
                                    as: "p",
                                    in: {
                                        _id: "$$p._id",
                                        name: "$$p.name",
                                        price: "$$p.price",
                                    },
                                },
                            },
                            else: null, // Jika tidak ada produk
                        },
                    },
                    memberRef: {
                        _id: 1,
                        memberId: 1,
                        cardId: 1,
                        name: 1,
                        phone: 1,
                    },
                    orderRef: 1,
                    isExpired: 1,
                    isUsed: 1,
                },
            },
        ];

        const result = await MemberVoucher.aggregatePaginate(
            MemberVoucher.aggregate(aggregationPipeline),
            options,
        );

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getVoucherById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const spesificData = await MemberVoucher.findOne(qMatch)
            .populate([
                {
                    path: "product",
                    select: ["name", "price"],
                },
                {
                    path: "member",
                    select: ["memberId", "cardId", "name", "phone"],
                },
            ])
            .lean();

        if (!spesificData) {
            return res.status(404).json({ message: "Voucher not found!" });
        }

        // Tambahkan isExpired berdasarkan today > expiry
        const today = new Date();
        const isExpired = spesificData.expiry
            ? today > spesificData.expiry
            : false;

        return res.json({ ...spesificData, isExpired });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getVoucherByScan = async (req, res) => {
    try {
        let qMatch = { voucherCode: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const spesificData = await MemberVoucher.findOne(qMatch)
            .populate([
                {
                    path: "product",
                    select: ["name", "price"],
                },
                {
                    path: "member",
                    select: ["memberId", "cardId", "name", "phone"],
                },
            ])
            .lean();

        if (!spesificData) {
            return res.status(404).json({ message: "Voucher not found!" });
        }

        // Tambahkan isExpired berdasarkan today > expiry
        const today = new Date();
        const isExpired = spesificData.expiry
            ? today > spesificData.expiry
            : false;

        return res.json({ ...spesificData, isExpired });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editVoucher = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const updatedData = await MemberVoucher.updateOne(qMatch, {
            $set: req.body,
        });
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteVoucher = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const deletedData = await MemberVoucher.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
