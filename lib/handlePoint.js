import PointHistory from "../models/point/pointHistory.js";

const checkPoint = (value) => Math.floor(value / 10000); // kelipatan 10.000

// Utility function to handle point adjustment
const adjustPointHistories = async (_member, _tenant, pointsNeeded, _orderPending, action, session) => {
    const pointHistories = await PointHistory.find(
        {
            memberRef: _member,
            tenantRef: _tenant,
            pointRemaining: { $gt: 0 },
            pointPendingUsed: 0,
            pointExpiry: { $gt: new Date() },
            status: "in",
        },
        null,
        { session },
    ).sort({ createdAt: 1 });

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

        await PointHistory.findOneAndUpdate({ _id: history._id }, updateFields, { session });
    }
};

const createPointHistory = async (_member, _order, _tenant, point, status, session) => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Tambah 1 tahun
    expiryDate.setHours(0, 0, 0, 0);

    // Base object for point history
    const objData = {
        memberRef: _member,
        orderRef: _order,
        tenantRef: _tenant,
        point,
        pointRemaining: status === "in" ? point : undefined,
        pointExpiry: status === "in" ? expiryDate : undefined,
        status,
    };

    // Create PointHistory
    await PointHistory.create([objData], { session });
};

export { checkPoint, adjustPointHistories, createPointHistory };
