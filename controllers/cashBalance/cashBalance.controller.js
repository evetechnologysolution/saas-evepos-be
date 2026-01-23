import Balance from "../../models/cashBalance/cashBalance.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllBalance = async (req, res) => {
    try {
        const { page, perPage, start, end } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (start && end) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            qMatch = {
                ...qMatch,
                startDate: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { startDate: -1 },
        };
        const listofData = await Balance.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getCashFlow = async (req, res) => {
    try {
        const { start, end } = req.query;

        const dStart = new Date(start);
        dStart.setHours(0, 0, 0, 0);
        const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

        const dEnd = new Date(end || start);
        dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
        const fixEnd = new Date(dEnd.toISOString());

        const cashFlow = await Balance.aggregate([
            {
                $match: {
                    $and: [
                        {
                            isOpen: { $ne: true },
                        },
                        {
                            startDate: {
                                $gte: fixStart,
                                $lte: fixEnd,
                            },
                        },
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$sales" },
                    cashIn: { $sum: "$cashIn" },
                    cashOut: { $sum: "$cashOut" },
                    refund: { $sum: "$refund" },
                    serviceCharge: { $sum: "$serviceCharge" },
                    tax: { $sum: "$tax" },
                },
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                    cashIn: 1,
                    cashOut: 1,
                    refund: 1,
                    serviceCharge: 1,
                    tax: 1,
                },
            },
        ]);

        const data = {
            start,
            end,
            sales: cashFlow.length > 0 ? cashFlow[0].sales : 0,
            cashIn: cashFlow.length > 0 ? cashFlow[0].cashIn : 0,
            cashOut: cashFlow.length > 0 ? cashFlow[0].cashOut : 0,
            refund: cashFlow.length > 0 ? cashFlow[0].refund : 0,
            serviceCharge: cashFlow.length > 0 ? cashFlow[0].serviceCharge : 0,
            tax: cashFlow.length > 0 ? cashFlow[0].tax : 0,
        };

        return res.json(data);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getBalanceById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const spesificData = await Balance.findOne(qMatch);
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getExistBalance = async (req, res) => {
    try {
        let qMatch = { isOpen: true };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const spesificData = await Balance.findOne(qMatch);
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
export const addBalance = async (req, res) => {
    try {
        let objData = {};

        if (req.userData) {
            objData.tenantRef = req.userData?.tenantRef;
            objData.outletRef = req.userData?.outletRef;
        }

        if (req.body.cashIn) {
            objData = {
                ...objData,
                $inc: { cashIn: req.body.cashIn },
                $push: {
                    history: {
                        title: req.body?.title || "Kas Masuk",
                        isCashOut: false,
                        amount: req.body.cashIn,
                    },
                },
            };
        }

        if (req.body.cashOut) {
            objData = {
                ...objData,
                $inc: { cashOut: req.body.cashOut },
                $push: {
                    history: {
                        title: req.body?.title || "Kas Keluar",
                        isCashOut: true,
                        amount: req.body.cashOut,
                    },
                },
            };
        }

        const data = await Balance.findOneAndUpdate(
            {
                isOpen: true,
            },
            objData,
            { new: true, upsert: true },
        );

        return res.json(data);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const closeBalance = async (req, res) => {
    try {
        let objData = {
            endDate: Date.now(),
            isOpen: false,
            notes: req?.body?.notes || "",
            difference: req?.body?.difference || 0,
        };

        if (req.body.cashOut) {
            objData = {
                ...objData,
                $inc: { cashOut: req.body.cashOut },
                $push: {
                    history: {
                        title: "Tutup Kas",
                        isCashOut: true,
                        amount: req.body.cashOut,
                    },
                },
            };
        }

        let qMatch = { isOpen: true };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const data = await Balance.findOneAndUpdate(qMatch, objData, {
            new: true,
            upsert: true,
        });

        return res.json(data);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// UPDATE A SPECIFIC DATA
export const editBalance = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const updatedData = await Balance.updateOne(qMatch, {
            $set: req.body,
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
export const deleteBalance = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const deletedData = await Balance.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
