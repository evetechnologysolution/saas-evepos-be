import mongoose from "mongoose";
import History from "../models/pointHistory.js";
import Member from "../models/member.js";
import Order from "../models/order.js";

export const getHistory = async (req, res) => {
    try {
        const { page, perPage, search, fromDate, toDate, member } = req.query;

        // Buat pipeline agregasi
        const pipeline = [];

        // Filter berdasarkan member
        if (member) {
            pipeline.push({
                $match: { member: mongoose.Types.ObjectId(member) },
            });
        }

        // Filter berdasarkan pencarian
        if (search) {
            // Cari member yang cocok dengan nama atau memberId
            const members = await Member.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { memberId: { $regex: search, $options: "i" } },
                    { cardId: { $regex: search, $options: "i" } },
                ],
            });
            const memberIds = members.map((item) => item._id);

            // Cari order yang cocok dengan orderId
            const orders = await Order.find({
                orderId: { $regex: search, $options: "i" },
            });
            const orderIds = orders.map((item) => item._id);

            pipeline.push({
                $match: {
                    $or: [
                        { memberRef: { $in: memberIds } },
                        { orderRef: { $in: orderIds } },
                    ],
                },
            });
        }

        // Filter berdasarkan rentang tanggal
        if (fromDate) {
            const dStart = new Date(fromDate);
            dStart.setHours(0, 0, 0, 0);
            const start = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(toDate || fromDate);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const end = new Date(dEnd.toISOString());

            pipeline.push({
                $match: {
                    date: { $gte: start, $lte: end },
                },
            });
        }

        // Tambahkan `$lookup` untuk referensi member
        pipeline.push({
            $lookup: {
                from: "members",
                localField: "member",
                foreignField: "_id",
                as: "memberDetails",
            },
        });

        // Tambahkan `$lookup` untuk referensi order
        pipeline.push({
            $lookup: {
                from: "orders",
                localField: "order",
                foreignField: "_id",
                as: "orderDetails",
            },
        });

        // Proyeksi data untuk menyederhanakan hasil
        pipeline.push({
            $project: {
                _id: 1,
                date: 1,
                memberRef: {
                    $cond: {
                        if: { $gt: [{ $size: "$memberDetails" }, 0] }, // Jika tidak kosong
                        then: {
                            _id: { $arrayElemAt: ["$memberDetails._id", 0] },
                            memberId: { $arrayElemAt: ["$memberDetails.memberId", 0] },
                            cardId: { $arrayElemAt: ["$memberDetails.cardId", 0] },
                            name: { $arrayElemAt: ["$memberDetails.name", 0] },
                        },
                        else: null, // Jika kosong, kembalikan null
                    },
                },
                orderRef: {
                    $cond: {
                        if: { $gt: [{ $size: "$orderDetails" }, 0] }, // Jika tidak kosong
                        then: {
                            _id: { $arrayElemAt: ["$orderDetails._id", 0] },
                            orderId: { $arrayElemAt: ["$orderDetails.orderId", 0] },
                            billedAmount: { $arrayElemAt: ["$orderDetails.billedAmount", 0] },
                        },
                        else: null, // Jika kosong, kembalikan null
                    },
                },
                orderPending: 1,
                point: 1,
                pointRemaining: 1,
                pointPendingUsed: 1,
                pointExpiry: 1,
                description: 1,
                status: 1,
            },
        });

        // Sortir data berdasarkan tanggal
        pipeline.push({ $sort: { date: -1 } });

        // Pagination dengan `mongoose-aggregation-paginate`
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
        };

        const result = await History.aggregatePaginate(History.aggregate(pipeline), options);

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


export const getHistoryOld = async (req, res) => {
    try {
        const { page, perPage, search, fromDate, toDate, member } = req.query;
        let query = {};

        // filtered by member
        if (member) {
            query.member = member;
        }

        // Search by name
        if (search) {
            const members = await Member.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { memberId: { $regex: search, $options: "i" } }, // Filter berdasarkan memberId
                    { cardId: { $regex: search, $options: "i" } } // Filter berdasarkan cardId
                ],
            });
            const filteredMember = members.map((item) => item._id);

            const orders = await Order.find({
                orderId: { $regex: search, $options: "i" },
            });
            const filteredOrder = orders.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    {
                        memberRef: { $in: filteredMember },
                    },
                    {
                        orderRef: { $in: filteredOrder },
                    },
                ],
            };
        }

        // Date range filter
        if (fromDate) {
            const dStart = new Date(fromDate);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(toDate || fromDate);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            query = {
                ...query,
                date: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }

        const options = {
            populate: [
                {
                    path: "member",
                    select: ["_id", "memberId", "cardId", "name"],
                },
                {
                    path: "order",
                    select: ["_id", "orderId", "billedAmount"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        };

        const listofData = await History.paginate(query, options);

        return res.json(listofData);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getHistoryById = async (req, res) => {
    try {
        const spesificData = await History.findById(req.params.id);

        if (!spesificData) {
            return res.status(404).json({
                status: 404,
                message: "Data not found!",
            });
        }

        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const addHistory = async (req) => {
    try {
        let objData = req.body;

        const createData = await History.create(objData);

        return res.json(createData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const editHistory = async (req, res) => {
    try {
        const exist = await History.findById(req.params.id);

        if (!exist) {
            return res.status(404).json({
                status: 404,
                message: "Data not found!",
            });
        }

        let objData = req.body;

        const updatedData = await History.updateOne(
            { _id: req.params.id },
            {
                $set: objData,
            }
        );

        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const deleteHistory = async (req, res) => {
    try {
        const exist = await History.findById(req.params.id);

        if (!exist) {
            return res.status(404).json({
                status: 404,
                message: "Data not found!",
            });
        }

        const deletedData = await History.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};