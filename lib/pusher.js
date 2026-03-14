import Pusher from "pusher";
import PushNotifications from "@pusher/push-notifications-server";

const pusherConnect = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});

const beamsClient = new PushNotifications({
    instanceId: process.env.PUSHER_BEAMS_INSTANCE_ID,
    secretKey: process.env.PUSHER_BEAMS_SECRET_KEY,
});

// Fungsi untuk notifikasi percobaan
export const testNotif = async (channel = "channel-call", event = "event-call", message = "Testing call from pusher") => {
    try {
        await pusherConnect.trigger(channel, event, { message });
        return {
            status: 200,
            message: "Event triggered successfully!",
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message || "Error triggering event",
        };
    }
};

// Fungsi untuk kirim notifikasi
export const pusherNotif = async (channel, event, body) => {
    try {
        // Validasi parameter sebelum mengirim event ke Pusher
        if (!channel || !event) {
            return { status: 400, message: "Channel and event must be provided." };
        }
        if (!body) {
            return { status: 400, message: "Body is required." };
        }
        await pusherConnect.trigger(channel, event, body);
        return {
            status: 200,
            message: "Event triggered successfully!",
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message || "Error triggering event",
        };
    }
};

export const pusherBeams = async (interest, title, body, data, redirectUrl) => {
    try {
        if (!interest || !title || !body) {
            return { status: 400, message: "interest, title and body are required." };
        }
        await beamsClient.publishToInterests([interest], {
            web: {
                notification: {
                    title,
                    body,
                    deep_link: `${redirectUrl || "https://evewash-pos-dev.vercel.app"}`,
                },
            },
            fcm: {
                notification: { title, body },
                data,
            },
            apns: {
                aps: {
                    alert: { title, body },
                    sound: "default",
                },
                data,
            },
        });
        return { status: 200, message: "Push notification sent!" };
    } catch (err) {
        return {
            status: 500,
            message: err.message || "Error triggering push notification",
        };
    }
};
