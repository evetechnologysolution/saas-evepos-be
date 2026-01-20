import cron from "node-cron";
import https from "https";
import "dotenv/config.js";
import PointHistory from "../models/pointHistory.js";
import Member from "../models/member/member.js";

const restartServer = async () => {
    try {
        console.log("Restarting server...");
        const res = await new Promise((resolve, reject) => {
            https
                .get(`${process.env.BE_URL}/healthz`, (response) => resolve(response))
                .on("error", reject);
        });

        if (res.statusCode === 200) {
            console.log("Server restarted!");
        } else {
            console.log(`Failed to restart server with status code: ${res.statusCode}`);
        }
    } catch (err) {
        console.error("Error during restart:", err.message);
    }
};

const skipSleepServer = cron.schedule("*/14 * * * *", restartServer);

// stop the skipSleepServer cron job
skipSleepServer.stop();

const resetPoint = async () => {
    try {
        const pointHistories = await PointHistory.aggregate([
            {
                $match: {
                    pointRemaining: { $gt: 0 },
                    pointExpiry: { $gte: new Date() },
                    transactionPending: { $eq: null },
                    status: "in",
                },
            },
            {
                $group: {
                    _id: "$member",
                    totalRemaining: { $sum: "$pointRemaining" },
                },
            },
            {
                $project: {
                    id: 0,
                    member: "$_id",
                    totalRemaining: 1,
                },
            },
        ]);

        for (const data of pointHistories) {
            await Member.updateOne(
                { _id: data.member },
                { $inc: { point: -data.totalRemaining } }
            );
        }

        await PointHistory.updateMany(
            {
                pointExpiry: { $gte: new Date() },
                pointRemaining: { $gt: 0 },
                transactionPending: null,
                status: "in",
            },
            { $set: { pointRemaining: 0 } }
        );
    } catch (error) {
        console.error("Error resetting points:", error);
    }
};

const resetPointHistory = cron.schedule("0 0 * * *", resetPoint, {
    schedule: true,
    timezone: "Asia/Jakarta",
});

resetPointHistory.stop();

export { skipSleepServer, resetPointHistory };
