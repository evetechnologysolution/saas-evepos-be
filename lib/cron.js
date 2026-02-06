import cron from "node-cron";
import https from "https";
import "dotenv/config.js";
import Subs from "../models/core/subscription.js";
import dbConnect from "../utils/dbConnect.js";

const restartServer = async () => {
    try {
        console.log("Restarting server...");
        const res = await new Promise((resolve, reject) => {
            https.get(`${process.env.BE_URL}/healthz`, (response) => resolve(response)).on("error", reject);
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

const checkSubsStatus = async () => {
    try {
        await dbConnect();

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        await Subs.updateMany(
            {
                endDate: { $lt: now },
                status: { $nin: ["expired", "canceled", "pending"] },
            },
            {
                $set: { status: "expired" },
            },
        );

        console.log("Reset status!");
    } catch (error) {
        console.error("Error reset status", error);
    }
};

// const resetSubsStatus = cron.schedule("*/1 * * * *", checkSubsStatus, {
const resetSubsStatus = cron.schedule("0 0 * * *", checkSubsStatus, {
    timezone: "Asia/Jakarta",
});

resetSubsStatus.stop();

export { skipSleepServer, resetSubsStatus };
