import mongoose from "mongoose";
import Progress from "../../models/pos/progress.js";
import ProgressLabel from "../../models/pos/progressLabel.js";
import Order from "../../models/pos/order.js";
import User from "../../models/core/user.js";
import { convertToE164 } from "../../lib/textSetting.js";
import { errorResponse } from "../../utils/errorResponse.js";

// Utility functions
const setStartOfDay = (d) => {
    d.setHours(0, 0, 0, 0);
    return new Date(d.toISOString());
};
const setEndOfDay = (d) => {
    d.setHours(23, 59, 59, 999);
    return new Date(d.toISOString());
};

// GETTING ALL THE DATA
export const getAllData = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            const checkOrder = await Order.find({
                $or: [
                    { orderId: { $regex: search, $options: "i" } },
                    { "customer.memberId": { $regex: search, $options: "i" } },
                    { "customer.name": { $regex: search, $options: "i" } },
                    {
                        "customer.phone": {
                            $regex: isNaN(search) ? search : convertToE164(search),
                            $options: "i",
                        },
                    },
                    { "customer.email": { $regex: search, $options: "i" } },
                ],
            });
            const filteredOrder = checkOrder.map((item) => item._id);

            qMatch = {
                ...qMatch,
                $or: [
                    { latestStatus: { $regex: search, $options: "i" } },
                    { orderRef: { $in: filteredOrder } },
                    ...(fixedId ? [{ _id: fixedId }] : []),
                ], // option i for case insensitivity to match upper and lower cases.
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
                { path: "orderRef", select: "orderId" },
                { path: "log.staffRef", select: "fullname" },
            ],
            lean: true,
            leanWithId: false,
        };
        const listofData = await Progress.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getAllLogs = async (req, res) => {
    try {
        const { page, perPage, search, staff, periodBy, start, end } = req.query;

        const pipeline = [];

        // --- Unwind log ---
        pipeline.push({ $unwind: "$log" });

        // --- Lookup orderRef ---
        pipeline.push({
            $lookup: {
                from: "orders",
                localField: "orderRef",
                foreignField: "_id",
                as: "refOrder",
            },
        });

        pipeline.push({ $unwind: "$refOrder" });

        // --- Lookup staff ---
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "log.staffRef",
                foreignField: "_id",
                as: "refStaff",
            },
        });

        pipeline.push({
            $unwind: {
                path: "$refStaff",
                preserveNullAndEmptyArrays: true,
            },
        });

        // qty per kg, per pcs
        // pipeline.push({
        //     $addFields: {
        //         qtyKg: {
        //             $sum: {
        //                 $map: {
        //                     input: "$refOrder.orders",
        //                     as: "o",
        //                     in: {
        //                         $cond: [{ $eq: [{ $strcasecmp: ["$$o.category", "Kiloan"] }, 0] }, "$$o.qty", 0],
        //                     },
        //                 },
        //             },
        //         },
        //         qtyPcs: {
        //             $sum: {
        //                 $map: {
        //                     input: "$refOrder.orders",
        //                     as: "o",
        //                     in: {
        //                         $cond: [{ $ne: [{ $strcasecmp: ["$$o.category", "Kiloan"] }, 0] }, "$$o.qty", 0],
        //                     },
        //                 },
        //             },
        //         },
        //     },
        // });
        pipeline.push({
            $addFields: {
                qtyKg: {
                    $cond: [{ $eq: [{ $ifNull: [{ $toLower: "$log.unit" }, ""] }, "kg"] }, "$log.qty", 0],
                },
                qtyPcs: {
                    $cond: [{ $ne: [{ $ifNull: [{ $toLower: "$log.unit" }, ""] }, "kg"] }, "$log.qty", 0],
                },
            },
        });

        // --- MATCH optional filters ---
        const qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData.tenantRef;
        }

        if (req.userData?.outletRef) {
            qMatch.outletRef = req.userData.outletRef;
        }

        // --- SEARCH (orderId, staff fullname, status) ---
        if (search && search.trim() !== "") {
            const regex = new RegExp(search, "i");

            pipeline.push({
                $match: {
                    $or: [{ "refOrder.orderId": regex }, { "refStaff.fullname": regex }, { "log.status": regex }],
                },
            });
        }

        // Filter staff
        if (staff && staff !== "all" && mongoose.Types.ObjectId.isValid(staff)) {
            qMatch["log.staffRef"] = mongoose.Types.ObjectId.createFromHexString(staff);
        }

        // --- DATE FILTER HANDLING ---
        let periodStart = null;
        let periodEnd = null;

        const now = new Date();

        // --- FILTER BY PERIOD ---
        if (periodBy && periodBy !== "all") {
            const y = now.getFullYear();
            const m = now.getMonth();
            const d = now.getDate();

            if (periodBy === "today") {
                const s = new Date(y, m, d);
                const e = new Date(y, m, d);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }

            if (periodBy === "this-week") {
                const day = now.getDay(); // 0-6
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Senin sebagai awal minggu
                const s = new Date(y, m, diff);
                const e = new Date(y, m, diff + 6);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }

            if (periodBy === "this-month") {
                const s = new Date(y, m, 1);
                const e = new Date(y, m + 1, 0); // last day
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }

            if (periodBy === "this-year") {
                const s = new Date(y, 0, 1);
                const e = new Date(y, 11, 31);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }
        }

        // Input manual start/end lebih prioritas
        if (start || end) {
            const dStart = new Date(start);
            periodStart = setStartOfDay(dStart);

            const dEnd = new Date(end || start);
            periodEnd = setEndOfDay(dEnd);
        }

        // Terapkan filter date ke qMatch
        if (periodStart || periodEnd) {
            qMatch["log.date"] = {};
            if (periodStart) qMatch["log.date"]["$gte"] = periodStart;
            if (periodEnd) qMatch["log.date"]["$lte"] = periodEnd;
        }

        if (Object.keys(qMatch).length > 0) {
            pipeline.push({ $match: qMatch });
        }

        // --- Sort newest first ---
        pipeline.push({
            $sort: { "log.date": -1 },
        });

        // --- Final projection ---
        pipeline.push({
            $project: {
                _id: 1,
                date: "$log.date",
                orderRef: {
                    _id: "$refOrder._id",
                    orderId: "$refOrder.orderId",
                },
                name: "$log.name",
                unit: "$log.unit",
                qty: "$log.qty",
                qtyKg: "$qtyKg",
                qtyPcs: "$qtyPcs",
                status: "$log.status",
                staffRef: {
                    _id: "$refStaff._id",
                    fullname: "$refStaff.fullname",
                },
            },
        });

        // --- Pagination options ---
        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(perPage) || 10,
            lean: true,
        };

        const result = await Progress.aggregatePaginate(Progress.aggregate(pipeline), options);

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getLogSummary = async (req, res) => {
    try {
        const { search, staff, periodBy, start, end } = req.query;

        const qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData.tenantRef;
        }

        if (req.userData?.outletRef) {
            qMatch.outletRef = req.userData.outletRef;
        }

        // ======================================================
        // GET INITIAL ACTIVITY FROM progressLabel
        // ======================================================

        const labelMatch = {};

        if (req.userData?.tenantRef) {
            labelMatch.tenantRef = req.userData.tenantRef;
        }

        const progressLabels = await ProgressLabel.find(labelMatch).select("_id name").sort({ createdAt: 1 }).lean();

        const initialActivity = progressLabels.map((item) => ({
            _id: item._id,
            status: item.name,
        }));

        // ======================================================
        // 1. HANDLE FILTER: staff
        // ======================================================
        let staffInfo = null;

        if (staff && staff !== "all" && mongoose.Types.ObjectId.isValid(staff)) {
            const staffId = staff;
            qMatch["log.staffRef"] = mongoose.Types.ObjectId.createFromHexString(staffId);

            staffInfo = await User.findById(staffId).select("_id date fullname role isActive").lean();
        }

        // ======================================================
        // 2. HANDLE FILTER: search
        // ======================================================
        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            qMatch.$or = [{ "refOrder.orderId": regex }, { "log.status": regex }];
        }

        // ======================================================
        // 3. HANDLE FILTER: period
        // ======================================================
        let periodStart = null;
        let periodEnd = null;
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();

        // PRESET PERIOD BASED ON periodBy
        if (periodBy && periodBy !== "all") {
            if (periodBy === "today") {
                const s = new Date(y, m, d);
                const e = new Date(y, m, d);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }

            if (periodBy === "this-week") {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const s = new Date(y, m, diff);
                const e = new Date(y, m, diff + 6);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }

            if (periodBy === "this-month") {
                const s = new Date(y, m, 1);
                const e = new Date(y, m + 1, 0);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }

            if (periodBy === "this-year") {
                const s = new Date(y, 0, 1);
                const e = new Date(y, 11, 31);
                periodStart = setStartOfDay(s);
                periodEnd = setEndOfDay(e);
            }
        }

        // OVERRIDE WITH MANUAL START/END
        if (start || end) {
            const dStart = new Date(start);
            const dEnd = new Date(end || start);

            periodStart = setStartOfDay(dStart);
            periodEnd = setEndOfDay(dEnd);
        }

        if (periodStart || periodEnd) {
            qMatch["log.date"] = {};
            if (periodStart) qMatch["log.date"]["$gte"] = periodStart;
            if (periodEnd) qMatch["log.date"]["$lte"] = periodEnd;
        }

        // ======================================================
        // 4. BASE PIPELINE (dipakai oleh summary dan top)
        // ======================================================
        const basePipeline = [];

        // UNWIND LOG
        basePipeline.push({ $unwind: "$log" });

        // LOOKUP ORDER
        basePipeline.push({
            $lookup: {
                from: "orders",
                localField: "orderRef",
                foreignField: "_id",
                as: "refOrder",
            },
        });
        basePipeline.push({ $unwind: "$refOrder" });

        // SEARCH & FILTER STAFF & DATE
        if (Object.keys(qMatch).length > 0) {
            basePipeline.push({ $match: qMatch });
        }

        basePipeline.push({
            $addFields: {
                qtyKg: {
                    $cond: [{ $eq: [{ $ifNull: [{ $toLower: "$log.unit" }, ""] }, "kg"] }, "$log.qty", 0],
                },
                qtyPcs: {
                    $cond: [{ $ne: [{ $ifNull: [{ $toLower: "$log.unit" }, ""] }, "kg"] }, "$log.qty", 0],
                },
            },
        });

        // ======================================================
        // 5. SUMMARY PIPELINE
        // ======================================================
        const summaryPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: "$log.statusRef", // ← group by statusRef
                    qty: { $sum: "$log.qty" },
                    qtyKg: { $sum: "$qtyKg" },
                    qtyPcs: { $sum: "$qtyPcs" },
                },
            },
            {
                $lookup: {
                    from: "progresslabels",
                    localField: "_id",
                    foreignField: "_id",
                    as: "refLabel",
                },
            },
            { $unwind: { path: "$refLabel", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    statusRef: "$_id", // ← expose statusRef
                    status: "$refLabel.name", // ← nama terbaru dari label
                    qty: 1,
                    qtyKg: 1,
                    qtyPcs: 1,
                },
            },
            { $sort: { qty: -1, status: -1 } },
        ];

        const summaryResult = await Progress.aggregate(summaryPipeline);

        const totalQty = summaryResult.reduce((a, b) => a + b.qty, 0);
        const totalQtyKg = summaryResult.reduce((a, b) => a + b.qtyKg, 0);
        const totalQtyPcs = summaryResult.reduce((a, b) => a + b.qtyPcs, 0);

        // ======================================================
        // 6. TOP PERFORMANCE PIPELINE
        // ======================================================
        const topPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: {
                        statusRef: "$log.statusRef",
                        staffRef: "$log.staffRef",
                    },
                    qty: { $sum: "$log.qty" },
                    qtyKg: { $sum: "$qtyKg" },
                    qtyPcs: { $sum: "$qtyPcs" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.staffRef",
                    foreignField: "_id",
                    as: "refStaff",
                },
            },
            { $unwind: { path: "$refStaff", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "progresslabels",
                    localField: "_id.statusRef",
                    foreignField: "_id",
                    as: "refLabel",
                },
            },
            { $unwind: { path: "$refLabel", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    statusRef: "$_id.statusRef",
                    status: "$refLabel.name",
                    staffRef: {
                        _id: "$refStaff._id",
                        fullname: "$refStaff.fullname",
                        role: "$refStaff.role",
                        isActive: "$refStaff.isActive",
                    },
                    qty: 1,
                    qtyKg: 1,
                    qtyPcs: 1,
                },
            },
            { $sort: { status: 1, qty: -1 } },
        ];

        const topRaw = await Progress.aggregate(topPipeline);

        // ======================================================
        // 7. NORMALIZE OUTPUT SESUAI initialActivity
        // ======================================================
        const merged = initialActivity
            .map((act) => {
                const found = summaryResult.find(
                    (r) => r.statusRef?.toString() === act._id?.toString(), // ← match by statusRef
                );
                return {
                    status: act.status,
                    qty: found?.qty || 0,
                    qtyKg: found?.qtyKg || 0,
                    qtyPcs: found?.qtyPcs || 0,
                };
            })
            .sort((a, b) => {
                if (b.qty !== a.qty) return b.qty - a.qty;
                return b.status.localeCompare(a.status);
            });

        const topPerformance = initialActivity
            .map((act) => {
                const found = topRaw.find((r) => r.status?.toLowerCase() === act.status?.toLowerCase());
                return {
                    status: act.status,
                    staffRef: found?.staffRef || null,
                    qty: found?.qty || 0,
                    qtyKg: found?.qtyKg || 0,
                    qtyPcs: found?.qtyPcs || 0,
                };
            })
            .sort((a, b) => {
                if (b.qty !== a.qty) return b.qty - a.qty;
                return b.status.localeCompare(a.status);
            });

        // ======================================================
        // SEND RESPONSE
        // ======================================================
        return res.json({
            period: { start: periodStart, end: periodEnd },
            staffRef: staffInfo,
            detail: merged,
            topPerformance,
            total: totalQty,
            totalKg: totalQtyKg,
            totalPcs: totalQtyPcs,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getLogSummaryV2 = async (req, res) => {
    try {
        const { search, staff, periodBy, start, end } = req.query;

        const isAllStaff = !staff || staff === "all";

        const qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData.tenantRef;
        }

        if (req.userData?.outletRef) {
            qMatch.outletRef = req.userData.outletRef;
        }

        // ======================================================
        // GET INITIAL ACTIVITY
        // ======================================================
        const labelMatch = {};

        if (req.userData?.tenantRef) {
            labelMatch.tenantRef = req.userData.tenantRef;
        }

        const progressLabels = await ProgressLabel.find(labelMatch)
            .select("_id name")
            .sort({ createdAt: 1 })
            .lean();

        const initialActivity = progressLabels.map((item) => ({
            _id: item._id,
            status: item.name,
        }));

        // ======================================================
        // SEARCH
        // ======================================================
        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            qMatch.$or = [
                { "refOrder.orderId": regex },
                { "log.status": regex },
            ];
        }

        // ======================================================
        // PERIOD
        // ======================================================
        let periodStart = null;
        let periodEnd = null;

        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();

        if (periodBy && periodBy !== "all") {
            if (periodBy === "today") {
                periodStart = setStartOfDay(new Date(y, m, d));
                periodEnd = setEndOfDay(new Date(y, m, d));
            }

            if (periodBy === "this-week") {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);

                periodStart = setStartOfDay(new Date(y, m, diff));
                periodEnd = setEndOfDay(new Date(y, m, diff + 6));
            }

            if (periodBy === "this-month") {
                periodStart = setStartOfDay(new Date(y, m, 1));
                periodEnd = setEndOfDay(new Date(y, m + 1, 0));
            }

            if (periodBy === "this-year") {
                periodStart = setStartOfDay(new Date(y, 0, 1));
                periodEnd = setEndOfDay(new Date(y, 11, 31));
            }
        }

        if (start || end) {
            const dStart = new Date(start);
            const dEnd = new Date(end || start);

            periodStart = setStartOfDay(dStart);
            periodEnd = setEndOfDay(dEnd);
        }

        if (periodStart || periodEnd) {
            qMatch["log.date"] = {};
            if (periodStart) qMatch["log.date"]["$gte"] = periodStart;
            if (periodEnd) qMatch["log.date"]["$lte"] = periodEnd;
        }

        // ======================================================
        // BASE PIPELINE
        // ======================================================
        const basePipeline = [
            { $unwind: "$log" },
            {
                $lookup: {
                    from: "orders",
                    localField: "orderRef",
                    foreignField: "_id",
                    as: "refOrder",
                },
            },
            { $unwind: "$refOrder" },
            ...(Object.keys(qMatch).length ? [{ $match: qMatch }] : []),
            {
                $addFields: {
                    qtyKg: {
                        $cond: [
                            {
                                $eq: [
                                    { $ifNull: [{ $toLower: "$log.unit" }, ""] },
                                    "kg",
                                ],
                            },
                            "$log.qty",
                            0,
                        ],
                    },
                    qtyPcs: {
                        $cond: [
                            {
                                $ne: [
                                    { $ifNull: [{ $toLower: "$log.unit" }, ""] },
                                    "kg",
                                ],
                            },
                            "$log.qty",
                            0,
                        ],
                    },
                },
            },
        ];

        // ======================================================
        // SUMMARY PIPELINE
        // ======================================================
        const summaryPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: isAllStaff
                        ? {
                            statusRef: "$log.statusRef",
                            staffRef: "$log.staffRef",
                        }
                        : "$log.statusRef",
                    qty: { $sum: "$log.qty" },
                    qtyKg: { $sum: "$qtyKg" },
                    qtyPcs: { $sum: "$qtyPcs" },
                },
            },
            {
                $lookup: {
                    from: "progresslabels",
                    localField: isAllStaff ? "_id.statusRef" : "_id",
                    foreignField: "_id",
                    as: "refLabel",
                },
            },
            { $unwind: { path: "$refLabel", preserveNullAndEmptyArrays: true } },

            ...(isAllStaff
                ? [
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id.staffRef",
                            foreignField: "_id",
                            as: "refStaff",
                        },
                    },
                    {
                        $unwind: {
                            path: "$refStaff",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                ]
                : []),

            {
                $project: {
                    _id: 0,
                    statusRef: isAllStaff ? "$_id.statusRef" : "$_id",
                    status: "$refLabel.name",
                    staffRef: isAllStaff
                        ? {
                            _id: "$refStaff._id",
                            fullname: "$refStaff.fullname",
                            role: "$refStaff.role",
                            isActive: "$refStaff.isActive",
                        }
                        : null,
                    qty: 1,
                    qtyKg: 1,
                    qtyPcs: 1,
                },
            },
        ];

        const summaryResult = await Progress.aggregate(summaryPipeline);

        // ======================================================
        // FORMAT DETAIL
        // ======================================================
        let merged;

        if (isAllStaff) {
            const mapStaff = new Map();

            for (const row of summaryResult) {
                const staffId = row?.staffRef?._id?.toString();
                if (!staffId) continue;

                if (!mapStaff.has(staffId)) {
                    mapStaff.set(staffId, {
                        staffRef: row.staffRef,
                        progress: [],
                    });
                }

                mapStaff.get(staffId).progress.push(row);
            }

            merged = Array.from(mapStaff.values()).map((staff) => {
                const progressMap = new Map(
                    staff.progress.map((p) => [p.status.toLowerCase(), p])
                );

                const fullProgress = initialActivity.map((act) => {
                    const found = progressMap.get(act.status.toLowerCase());
                    return {
                        status: act.status,
                        qty: found?.qty || 0,
                        qtyKg: found?.qtyKg || 0,
                        qtyPcs: found?.qtyPcs || 0,
                    };
                });

                return {
                    staffRef: staff.staffRef,
                    progress: fullProgress.sort((a, b) => b.status - a.status),
                };
            })
                .sort((a, b) =>
                    (a.staffRef?.fullname || "")
                        .toLowerCase()
                        .localeCompare((b.staffRef?.fullname || "").toLowerCase())
                );
        } else {
            merged = initialActivity.map((act) => {
                const found = summaryResult.find(
                    (r) => r.statusRef?.toString() === act._id?.toString()
                );

                return {
                    status: act.status,
                    qty: found?.qty || 0,
                    qtyKg: found?.qtyKg || 0,
                    qtyPcs: found?.qtyPcs || 0,
                };
            });
        }

        // ======================================================
        // TOP PERFORMANCE
        // ======================================================
        const topPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: {
                        statusRef: "$log.statusRef",
                        staffRef: "$log.staffRef",
                    },
                    qty: { $sum: "$log.qty" },
                    qtyKg: { $sum: "$qtyKg" },
                    qtyPcs: { $sum: "$qtyPcs" },
                },
            },
            { $sort: { "_id.statusRef": 1, qty: -1 } },
            {
                $group: {
                    _id: "$_id.statusRef",
                    top: { $first: "$$ROOT" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "top._id.staffRef",
                    foreignField: "_id",
                    as: "refStaff",
                },
            },
            { $unwind: "$refStaff" },
            {
                $lookup: {
                    from: "progresslabels",
                    localField: "_id",
                    foreignField: "_id",
                    as: "refLabel",
                },
            },
            { $unwind: "$refLabel" },
            {
                $project: {
                    _id: 0,
                    status: "$refLabel.name",
                    staffRef: {
                        _id: "$refStaff._id",
                        fullname: "$refStaff.fullname",
                        role: "$refStaff.role",
                        isActive: "$refStaff.isActive",
                    },
                    qty: "$top.qty",
                    qtyKg: "$top.qtyKg",
                    qtyPcs: "$top.qtyPcs",
                },
            },
        ];

        const topPerformance = await Progress.aggregate(topPipeline);

        // ======================================================
        // TOTAL
        // ======================================================
        const totalQty = summaryResult.reduce((a, b) => a + b.qty, 0);
        const totalQtyKg = summaryResult.reduce((a, b) => a + b.qtyKg, 0);
        const totalQtyPcs = summaryResult.reduce((a, b) => a + b.qtyPcs, 0);

        return res.json({
            period: { start: periodStart, end: periodEnd },
            detail: merged,
            topPerformance,
            total: totalQty,
            totalKg: totalQtyKg,
            totalPcs: totalQtyPcs,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getDataById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Progress.findOne(qMatch)
            .populate([
                { path: "orderRef", select: "orderId" },
                { path: "log.staffRef", select: "fullname" },
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const objData = { ...req.body };

        if (req.userData) {
            objData.tenantRef = req.userData.tenantRef;

            if (req.userData?.outletRef) {
                objData.outletRef = req.userData.outletRef;
            }
        }

        // ================= NORMALIZE LOG =================
        let processedLog = [];

        if (objData.log) {
            const staffId = req.userData?._id;

            if (Array.isArray(objData.log)) {
                processedLog = objData.log.map((item) => ({
                    ...item,
                    staffRef: item?.staffRef || staffId,
                    status: item?.status?.toLowerCase().trim() || "",
                }));
            } else if (typeof objData.log === "object") {
                processedLog = [
                    {
                        ...objData.log,
                        staffRef: objData.log.staffRef || staffId,
                        status: objData.log?.status?.toLowerCase().trim() || "",
                    },
                ];
            }
        }

        if (processedLog.length === 0) {
            throw new Error("Log data tidak ditemukan");
        }

        objData.log = processedLog;

        const logItem = processedLog[0];

        const qtyInput = Number(logItem.qty || 0);
        const itemId = String(logItem.id);
        const status = String(logItem.status || "");
        const orderId = objData.orderRef;

        // ================= VALIDASI STATUS =================
        if (!status && !logItem.statusRef) {
            throw new Error("Status log wajib diisi");
        }

        // ================= GET ORDER ITEM =================
        const order = await Order.findOne({ _id: orderId, "orders.id": itemId }, { "orders.$": 1 }, { session });

        if (!order) {
            throw new Error("Order item tidak ditemukan");
        }

        const orderItem = order.orders[0];

        // ================= HITUNG LOG EXISTING =================
        const progressList = await Progress.find(
            {
                orderRef: orderId,
                "log.id": itemId,
                "log.status": status,
            },
            {
                log: {
                    $elemMatch: {
                        id: itemId,
                        status: status,
                    },
                },
            },
            { session },
        );

        let usedQty = 0;

        for (const progress of progressList) {
            const lg = progress.log?.[0];
            if (lg) {
                usedQty += Number(lg.qty || 0);
            }
        }

        const remainingQty = Math.max(0, Math.round(((orderItem.qty || 0) - usedQty) * 10) / 10);

        if (qtyInput > remainingQty) {
            throw new Error(`Qty status ${status} melebihi limit. Sisa qty: ${remainingQty}`);
        }

        // ================= SAVE PROGRESS =================
        const data = new Progress(objData);

        const newData = await data.save({ session });

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

// CREATE DATA BY ORDER
export const addDataByOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { lockerName, ...objData } = req.body;
        const orderId = req.params.id;

        if (req.userData) {
            objData.tenantRef = req.userData.tenantRef;

            if (req.userData?.outletRef) {
                objData.outletRef = req.userData.outletRef;
            }
        }

        // ================= NORMALIZE LOG =================
        let processedLog = [];

        if (objData.log) {
            const staffId = req.userData?._id;

            if (Array.isArray(objData.log)) {
                processedLog = objData.log.map((item) => ({
                    ...item,
                    staffRef: item?.staffRef || staffId,
                    status: item?.status?.toLowerCase().trim() || "",
                }));
            } else if (typeof objData.log === "object") {
                processedLog = [
                    {
                        ...objData.log,
                        staffRef: objData.log.staffRef || staffId,
                        status: objData.log?.status?.toLowerCase().trim() || "",
                    },
                ];
            }
        }

        delete objData.log;

        // ================= VALIDASI STATUS =================
        for (const item of processedLog) {
            if (!item.status && !item.statusRef) {
                throw new Error("Status log wajib diisi");
            }
        }

        // ================= VALIDASI QTY =================
        if (processedLog.length > 0) {

            // ambil order
            const order = await Order.findById(orderId, { orders: 1 }, { session });

            if (!order) {
                throw new Error("Order tidak ditemukan");
            }

            // ambil semua progress log
            const progressList = await Progress.find(
                { orderRef: orderId },
                { log: 1 },
                { session }
            );

            const usedQtyMap = {};

            // ================= HITUNG PROGRESS EXISTING =================
            for (const progress of progressList) {
                for (const lg of progress.log || []) {
                    if (!lg.id || !lg.status) continue;

                    const key = `${lg.id}_${lg.status}`;

                    usedQtyMap[key] =
                        (usedQtyMap[key] || 0) + Number(lg.qty || 0);
                }
            }

            // ================= HITUNG TOTAL ORDER QTY PER ITEM =================
            const orderQtyMap = {};

            for (const item of order.orders || []) {
                const itemId = String(item.id);

                orderQtyMap[itemId] =
                    (orderQtyMap[itemId] || 0) + Number(item.qty || 0);
            }

            // ================= VALIDASI INPUT =================
            for (const logItem of processedLog) {
                const itemId = String(logItem.id);
                const status = String(logItem.status || "");
                const qtyInput = Number(logItem.qty || 0);

                const totalOrderQty = orderQtyMap[itemId] || 0;

                if (!totalOrderQty) {
                    throw new Error("Item order tidak ditemukan");
                }

                const key = `${itemId}_${status}`;
                const usedQty = usedQtyMap[key] || 0;

                // pembulatan supaya tidak kena bug floating number
                const remainingQty = Math.max(
                    0,
                    Math.round((totalOrderQty - usedQty) * 10) / 10
                );

                if (qtyInput > remainingQty) {
                    throw new Error(
                        `Qty status ${status} melebihi limit. Sisa qty: ${remainingQty}`
                    );
                }

                // update map supaya validasi multi input tetap benar
                usedQtyMap[key] = usedQty + qtyInput;
            }
        }

        // ================= UPDATE ORDER =================
        if (lockerName) {
            await Order.updateOne(
                { _id: orderId },
                { $set: { lockerName } },
                { session }
            );
        }

        // ================= UPSERT PROGRESS =================
        const update = {};

        if (processedLog.length > 0) {
            update.$push = {
                log: { $each: processedLog },
            };
        }

        if (Object.keys(objData).length > 0) {
            update.$set = objData;
        }

        const qProgress = {
            orderRef: orderId,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        const updatedProgress = await Progress.findOneAndUpdate(
            qProgress,
            update,
            {
                new: true,
                upsert: true,
                session,
            }
        );

        await session.commitTransaction();
        session.endSession();

        return res.json(updatedProgress);

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

// DELETE A SPECIFIC DATA
export const deleteData = async (req, res) => {
    try {
        const { id } = req.params;

        // ================= QUERY =================
        const qMatch = {
            _id: id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        const qProgress = {
            progress: id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        // ================= EXECUTE PARALLEL =================
        const [deletedData] = await Promise.all([
            Progress.deleteOne(qMatch),
            Order.findOneAndUpdate(qProgress, { $set: { progress: null } }),
        ]);

        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
