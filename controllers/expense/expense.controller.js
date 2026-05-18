import mongoose from "mongoose";
import Expense from "../../models/expense/expense.js";

// GETTING ALL THE DATA
export const getAllExpense = async (req, res) => {
    try {
        const { page, perPage, code, search, sort } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;

            if (outletRef != null) {
                qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }
        if (code) {
            qMatch = {
                ...qMatch,
                code: code,
            };
        }
        if (search) {
            qMatch = {
                ...qMatch,
                description: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
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
        };
        const listofData = await Expense.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getExpenseTotal = async (req, res) => {
    try {
        const { start, end, filter } = req.query;

        let fixStart, fixEnd;
        const now = new Date();

        // =========================
        // HANDLE FILTER TANGGAL
        // =========================
        if (filter) {
            if (filter === "today") {
                fixStart = new Date(now.setHours(0, 0, 0, 0));
                fixEnd = new Date(now.setHours(23, 59, 59, 999));
            } else if (filter === "thisWeek") {
                const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
                fixStart = new Date(firstDay.setHours(0, 0, 0, 0));
                fixEnd = new Date(now.setHours(23, 59, 59, 999));
            } else if (filter === "thisMonth") {
                fixStart = new Date(now.getFullYear(), now.getMonth(), 1);
                fixEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            } else if (filter === "thisYear") {
                fixStart = new Date(now.getFullYear(), 0, 1);
                fixEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else {
                return res.status(400).json({ message: "Filter tidak valid" });
            }
        } else {
            if (!start) return res.status(400).json({ message: "Tanggal mulai diperlukan." });

            fixStart = new Date(start);
            fixStart.setHours(0, 0, 0, 0);

            fixEnd = new Date(end || start);
            fixEnd.setHours(23, 59, 59, 999);
        }

        // =========================
        // MATCH QUERY
        // =========================
        const matchQuery = {
            createdAt: { $gte: fixStart, $lte: fixEnd },
        };

        // 🔐 filter tenant & outlet dari token
        if (req.userData?.tenantRef) {
            matchQuery.tenantRef = req.userData.tenantRef;
        }

        if (req.userData?.outletRef) {
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;

            if (outletRef != null) {
                matchQuery.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }

        // =========================
        // AGGREGATION
        // =========================
        const data = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    expense: { $sum: "$amount" },
                },
            },
            {
                $project: {
                    _id: 0,
                    expense: 1,
                },
            },
        ]);

        return res.json({
            start: fixStart,
            end: fixEnd,
            totalExpense: data.length ? data[0].expense : 0,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getExpenseById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;

            if (outletRef != null) {
                qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }
        const spesificData = await Expense.findOne(qMatch);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addExpense = async (req, res) => {
    try {
        let objData = req.body;
        if (req.userData) {
            objData.tenantRef = req.userData?.tenantRef;
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;
            if (outletRef != null) {
                objData.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }
        const data = new Expense(objData);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editExpense = async (req, res) => {
    try {
        const objData = req.body;
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;

            if (outletRef != null) {
                qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }
        const updatedData = await Expense.updateOne(
            qMatch,
            {
                $set: objData,
            },
        );
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteExpense = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;

            if (outletRef != null) {
                qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }

        const deletedData = await Expense.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
