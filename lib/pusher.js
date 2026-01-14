import Pusher from "pusher";

export const pusherConnect = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

const generateMessage = (data) => {
    if (data.orderType.toLowerCase() === "delivery") {
        return `New Delivery Order from ${data.customer.name} (${data.customer.phone})`;
    }
    return null;
};

// Fungsi untuk notifikasi percobaan
export const testNotif = async (channel = "channel-call", event = "event-call", message = "Testing call from pusher") => {
    try {
        await pusherConnect.trigger(channel, event, { message });
        return {
            status: 200,
            message: "Event triggered successfully!"
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message || "Error triggering event"
        };
    }
};

// Fungsi untuk notifikasi order
export const orderNotif = async (req, res, channel = "channel-order", event = "event-order") => {
    if (req.body.orderType === "delivery") {
        const message = generateMessage(req.body);
        if (message) {
            try {
                await pusherConnect.trigger(channel, event, { message });
                return res.status(200).json({
                    message: "Event triggered successfully!"
                });
            } catch (err) {
                return res.status(500).json({
                    message: err.message || "Error triggering order event"
                });
            }
        }
        return res.status(400).json({
            message: "Invalid order data"
        });
    } else {
        return res.status(400).json({
            message: "Order type must be delivery"
        });
    }
};

// Fungsi untuk notifikasi pesan masuk
export const messageNotif = async (channel, event, body) => {
    try {
        // Validasi parameter sebelum mengirim event ke Pusher
        if (!channel || !event) {
            return {
                status: 400,
                message: "Channel and event must be provided."
            };
        }

        if (!body) {
            return {
                status: 400,
                message: "Body is required."
            };
        }

        await pusherConnect.trigger(channel, event, body);
        return {
            status: 200,
            message: "Event triggered successfully!"
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message || "Error triggering event"
        };
    }
};
