import { testNotif } from "../lib/pusher.js";

export const testCall = async (req, res) => {
    try {
        const result = await testNotif();
        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};