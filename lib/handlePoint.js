import PointHistory from "../models/pointHistory.js";

const checkPoint = (value) => {
    if (value < 10000) {
        return 0; // Tidak ada kelipatan jika nilai kurang dari 10.000
    } else {
        const count = Math.floor(value / 10000); // Menghitung jumlah kelipatan
        return count;
    }
};

// Utility function to handle point adjustment
const adjustPointHistories = async (_member, pointsNeeded, _orderPending, action) => {
    const pointHistories = await PointHistory.find({
        memberRef: _member,
        pointRemaining: { $gt: 0 },
        pointPendingUsed: 0,
        pointExpiry: { $gt: new Date() },
        status: "in",
    }).sort({ date: 1 });

    for (const history of pointHistories) {
        if (pointsNeeded <= 0) break;

        const pointsToUse = Math.min(history.pointRemaining, pointsNeeded);
        pointsNeeded -= pointsToUse;

        const updateFields =
            action === "reduce"
                ? { $inc: { pointRemaining: -pointsToUse } }
                : {
                    $set: {
                        orderPendingRef: _orderPending,
                        pointPendingUsed: pointsToUse,
                    },
                };

        await PointHistory.findOneAndUpdate({ _id: history._id }, updateFields);
    }
};

const createPointHistory = async (_member, _order, point, status) => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Tambah 1 tahun
    expiryDate.setHours(0, 0, 0, 0);

    // Base object for point history
    const objData = {
        memberRef: _member,
        orderRef: _order,
        point,
        pointRemaining: status === "in" ? point : undefined,
        pointExpiry: status === "in" ? expiryDate : undefined,
        status,
    };

    // Create PointHistory
    await PointHistory.create(objData);
};

export { checkPoint, adjustPointHistories, createPointHistory };
